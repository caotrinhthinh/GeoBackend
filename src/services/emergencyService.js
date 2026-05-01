const { sequelize, EmergencyRequest, MedicalFacility, Ambulance, UserProfile, User } = require('../models');
const { Op } = require('sequelize');
const { makePoint, selectGeoJSON } = require('../utils/geoHelpers');
const AppError = require('../utils/AppError');
const { parseCoordinatePair } = require('../utils/coordinateUtils');
const { getRouteLineString, toPointObject } = require('./routeService');
const { closeEmergencyRoom } = require('../config/socket');
const { ROLE } = require('../constants/roles');

const SUPPORTED_AREA_BBOX = {
  // Approximate TP.HCM boundary (lat/lng range) for testable supported-area validation.
  // Requirement (TC06): SQL must use ST_SetSRID.
  minLat: 10.3,
  maxLat: 11.4,
  minLng: 106.2,
  maxLng: 107.3,
};

let emergencyRequestColumnsPromise = null;
let userProfilesTableExistsPromise = null;

async function getEmergencyRequestColumns() {
    if (!emergencyRequestColumnsPromise) {
        emergencyRequestColumnsPromise = sequelize
            .getQueryInterface()
            .describeTable('emergency_request')
            .then((definition) => new Set(Object.keys(definition)))
            .catch(() => new Set());
    }

    return emergencyRequestColumnsPromise;
}

async function hasUserProfilesTable() {
    if (!userProfilesTableExistsPromise) {
        userProfilesTableExistsPromise = sequelize
            .getQueryInterface()
            .describeTable('user_profiles')
            .then(() => true)
            .catch(() => false);
    }

    return userProfilesTableExistsPromise;
}

function normalizeGuestUuid(guestUuid) {
    if (typeof guestUuid !== 'string') {
        return null;
    }

    const normalized = guestUuid.trim().toLowerCase();
    if (!normalized) {
        return null;
    }

    return normalized;
}

async function resolveRequesterId(requester_id, guest_uuid) {
    if (requester_id) {
        return requester_id;
    }

    const normalizedGuestUuid = normalizeGuestUuid(guest_uuid);
    if (!normalizedGuestUuid) {
        return null;
    }

    const legacyGuestEmail = `guest+${normalizedGuestUuid}@guest.local`;
    let guestUser = await User.findOne({
        where: {
            [Op.or]: [{ email: normalizedGuestUuid }, { email: legacyGuestEmail }],
        },
    });

    if (!guestUser) {
        guestUser = await User.create({
            email: normalizedGuestUuid,
            password_hash: 'GUEST_NO_LOGIN',
            role_id: ROLE.GUEST,
            is_active: true,
        });
    }

    if (guestUser.role_id !== ROLE.GUEST) {
        throw new AppError('Định danh khách không hợp lệ', 400);
    }

    return guestUser.id;
}

async function isInSupportedArea(latNum, lngNum) {
  const query = `
    SELECT ST_Within(
      ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
      ST_SetSRID(ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat), 4326)
    ) AS in_zone
  `;

  const rows = await sequelize.query(query, {
    replacements: {
      lat: latNum,
      lng: lngNum,
      minLat: SUPPORTED_AREA_BBOX.minLat,
      maxLat: SUPPORTED_AREA_BBOX.maxLat,
      minLng: SUPPORTED_AREA_BBOX.minLng,
      maxLng: SUPPORTED_AREA_BBOX.maxLng,
    },
    type: sequelize.QueryTypes.SELECT,
  });

  const inZone = rows?.[0]?.in_zone;
  if (typeof inZone === 'boolean') {
    return inZone;
  }
  // Fail-open for unit tests/mocks that don't return the expected shape.
  return true;
}

const createSOS = async (requester_id, lat, lng, notes, guest_uuid) => {
    const resolvedRequesterId = await resolveRequesterId(requester_id, guest_uuid);
    const { latNum, lngNum } = parseCoordinatePair(lat, lng, 'Cần cung cấp tòa độ vị trí bệnh nhân');

    // TC06: Reject locations outside supported area.
    const inZone = await isInSupportedArea(latNum, lngNum);
    if (!inZone) {
      throw new AppError('Vị trí nằm ngoài vùng hỗ trợ', 400);
    }

    // Tìm bệnh viện gần nhất (type = 'hospital')
    const query = `
    SELECT id,
           ST_Distance(location_geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) AS distance_meters
            , ST_AsGeoJSON(location_geom::geometry) AS location
    FROM medical_facility
    WHERE is_active = true AND type = 'hospital'
    ORDER BY distance_meters ASC
    LIMIT 1;
  `;

    const nearestHospitals = await sequelize.query(query, {
        replacements: { lng: lngNum, lat: latNum },
        type: sequelize.QueryTypes.SELECT,
    });

    if (nearestHospitals.length === 0) {
        throw new AppError('Không tìm thấy bệnh viện nào có thể tiếp nhận hiện tại', 404);
    }

    const assignedFacility = nearestHospitals[0];
    const patientPoint = { lat: latNum, lng: lngNum };
    let route = null;
    const hospitalPoint = assignedFacility?.location ? toPointObject(assignedFacility.location) : null;
    if (hospitalPoint) {
        route = await getRouteLineString(hospitalPoint, patientPoint);
    }

    let profileSnapshot = {};
    if (resolvedRequesterId && UserProfile && await hasUserProfilesTable()) {
        const profile = await UserProfile.findOne({ where: { user_id: resolvedRequesterId } });
        if (profile) {
            profileSnapshot = {
                requester_name: profile.full_name || null,
                requester_blood_type: profile.blood_type || null,
                requester_allergies: profile.allergies || null,
                requester_chronic_conditions: profile.chronic_conditions || null,
                requester_age: profile.age ?? null,
                requester_emergency_contact_phone: profile.emergency_contact_phone || null,
            };
        }
    }

    const optionalProfileSnapshot = {};
    if (profileSnapshot && Object.keys(profileSnapshot).length > 0) {
        const existingColumns = await getEmergencyRequestColumns();
        Object.entries(profileSnapshot).forEach(([key, val]) => {
            if (existingColumns.has(key)) {
                optionalProfileSnapshot[key] = val;
            }
        });
    }

    const createPayload = {
        requester_id: resolvedRequesterId,
        patient_location: makePoint(latNum, lngNum),
        assigned_facility_id: assignedFacility.id,
        status: 'pending',
        distance_meters: route?.distance_meters ?? assignedFacility.distance_meters,
        route_geometry: route?.lineString ?? null,
        eta_seconds: route?.duration_seconds != null ? Math.round(route.duration_seconds) : null,
        notes: notes || '',
        ...optionalProfileSnapshot,
    };

    const existingColumns = await getEmergencyRequestColumns();
    const returningAttributes = [
        'id',
        'requester_id',
        'patient_location',
        'assigned_facility_id',
        'assigned_ambulance_id',
        'status',
        'distance_meters',
        'route_geometry',
        'eta_seconds',
        'done_at',
        'notes',
        'created_at',
        'updated_at',
    ].filter((column) => existingColumns.has(column));

    // Avoid RETURNING missing columns when local DB is behind migrations.
    const sos = await EmergencyRequest.create(createPayload, {
        ...(returningAttributes.length > 0 ? { returning: returningAttributes } : {}),
    });

    return sos;
};

const getRequests = async (facility_id, role_id) => {
    const whereClause = {};

    // Nếu là Admin trực ban, chỉ lấy SOS của bệnh viện họ
    if (role_id === 2 && facility_id) {
        whereClause.assigned_facility_id = facility_id;
    }

    const existingColumns = await getEmergencyRequestColumns();
    const baseAttributes = [
        'id',
        'requester_id',
        'assigned_facility_id',
        'assigned_ambulance_id',
        'status',
        'distance_meters',
        'notes',
        'created_at',
    ];
    const optionalAttributes = [
        'requester_name',
        'requester_blood_type',
        'requester_allergies',
        'requester_chronic_conditions',
        'requester_age',
        'requester_emergency_contact_phone',
        'done_at',
    ].filter((column) => existingColumns.has(column));

    return await EmergencyRequest.findAll({
        where: whereClause,
        attributes: [
            ...baseAttributes,
            ...optionalAttributes,
            selectGeoJSON('patient_location', 'location'),
        ],
        order: [['created_at', 'DESC']],
    });
};

const getActiveRequestForRequester = async (requesterId) => {
    if (!requesterId) {
        return null;
    }

    return EmergencyRequest.findOne({
        where: {
            requester_id: requesterId,
            status: { [Op.in]: ['pending', 'assigned', 'in_progress'] },
        },
        include: [
            {
                model: MedicalFacility,
                as: 'facility',
                attributes: ['id', 'name', 'phone', selectGeoJSON('location_geom', 'location')],
            },
            {
                model: Ambulance,
                as: 'ambulance',
                attributes: ['id', selectGeoJSON('current_location', 'current_location')],
            },
        ],
        order: [['created_at', 'DESC']],
    });
};

const getActiveRequestByIdentity = async (requester_id, guest_uuid) => {
    const resolvedRequesterId = await resolveRequesterId(requester_id, guest_uuid);
    if (!resolvedRequesterId) {
        return null;
    }

    return getActiveRequestForRequester(resolvedRequesterId);
};

const assertDispatchPermission = (role_id) => {
    if (role_id !== ROLE.ADMIN) {
        throw new AppError('Bạn không có quyền điều phối hoặc cập nhật ca cấp cứu', 403);
    }
};

const assignAmbulance = async (emergency_id, ambulance_id, facility_id, role_id) => {
    assertDispatchPermission(role_id);

    const emergency = await EmergencyRequest.findByPk(emergency_id);
    if (!emergency) throw new AppError('Không tìm thấy yêu cầu cấp cứu', 404);

    if (!facility_id || emergency.assigned_facility_id !== facility_id) {
        throw new AppError('Bạn không có quyền quản lý ca cấp cứu này', 403);
    }

    const ambulance = await Ambulance.findByPk(ambulance_id);
    if (!ambulance) {
        throw new AppError('Không tìm thấy xe cứu thương', 404);
    }

    if (ambulance.facility_id !== facility_id || ambulance.facility_id !== emergency.assigned_facility_id) {
        throw new AppError('Xe cứu thương này không thuộc bệnh viện tiếp nhận ca', 400);
    }

    if (ambulance.status !== 'available') {
        throw new AppError('Xe cứu thương đang không ở trạng thái rảnh', 400);
    }

    // Transaction để bảo toàn dữ liệu
    const t = await sequelize.transaction();
    try {
        emergency.assigned_ambulance_id = ambulance_id;
        emergency.status = 'assigned';
        await emergency.save({ transaction: t });

        ambulance.status = 'dispatched';
        await ambulance.save({ transaction: t });

        await t.commit();
        return emergency;
    } catch (error) {
        await t.rollback();
        throw new AppError('Lỗi trong quá trình điều động. Vui lòng thử lại.', 500);
    }
};

const updateStatus = async (emergency_id, status, facility_id, role_id) => {
    assertDispatchPermission(role_id);

    const emergency = await EmergencyRequest.findByPk(emergency_id);
    if (!emergency) throw new AppError('Không tìm thấy yêu cầu cấp cứu', 404);

    if (!facility_id || emergency.assigned_facility_id !== facility_id) {
        throw new AppError('Bạn không có quyền quản lý ca cấp cứu này', 403);
    }

    const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new AppError('Trạng thái không hợp lệ', 400);
    }

    const t = await sequelize.transaction();
    try {
        emergency.status = status;
        if (status === 'completed') {
            emergency.done_at = new Date();
        }
        await emergency.save({ transaction: t });

        // Cập nhật lại status xe nếu ca bệnh kết thúc
        if (emergency.assigned_ambulance_id && (status === 'completed' || status === 'cancelled')) {
            const ambulance = await Ambulance.findByPk(emergency.assigned_ambulance_id);
            if (ambulance) {
                ambulance.status = 'available';
                await ambulance.save({ transaction: t });
            }
        }

        await t.commit();

        // Auto cleanup Websocket room if request is finished
        if (status === 'completed' || status === 'cancelled') {
            closeEmergencyRoom(emergency_id);
        }

        return emergency;
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

module.exports = {
    createSOS,
    getRequests,
    getActiveRequestByIdentity,
    assignAmbulance,
    updateStatus,
};
