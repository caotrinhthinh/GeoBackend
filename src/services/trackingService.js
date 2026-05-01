const { AmbulanceTracking, Ambulance, EmergencyRequest } = require('../models');
const { makePoint, selectGeoJSON } = require('../utils/geoHelpers');
const AppError = require('../utils/AppError');
const { parseCoordinatePair } = require('../utils/coordinateUtils');
const { emitTrackingUpdate } = require('../config/socket');

const recordGPS = async (ambulance_id, lat, lng, emergency_request_id, facility_id, role_id) => {
    const { latNum, lngNum } = parseCoordinatePair(lat, lng, 'Cần cung cấp lat và lng');

    const ambulance = await Ambulance.findByPk(ambulance_id);
    if (!ambulance) throw new AppError('Không tìm thấy xe cứu thương', 404);

    if (role_id === 2 && ambulance.facility_id !== facility_id) {
        throw new AppError('Bạn không có quyền log GPS cho xe của bệnh viện khác', 403);
    }

    // Use a transaction so location update, tracking log and optional emergency status update are atomic.
    // Fail-open for unit tests/mocks that don't provide `Ambulance.sequelize`.
    const t = Ambulance?.sequelize?.transaction ? await Ambulance.sequelize.transaction() : null;
    try {
        // Update current location in ambulance table
        ambulance.current_location = makePoint(latNum, lngNum);
        if (t) {
            await ambulance.save({ transaction: t });
        } else {
            await ambulance.save();
        }

        // If this tracking message is tied to an emergency, and that emergency is currently 'assigned', mark it 'in_progress'
        if (emergency_request_id && typeof EmergencyRequest?.findByPk === 'function') {
            const emergency = t
                ? await EmergencyRequest.findByPk(emergency_request_id, { transaction: t })
                : await EmergencyRequest.findByPk(emergency_request_id);

            if (emergency && emergency.status === 'assigned') {
                emergency.status = 'in_progress';
                if (t) {
                    await emergency.save({ transaction: t });
                } else {
                    await emergency.save();
                }
            }
        }

        // Create log entry in tracking table
        const trackingRecord = await AmbulanceTracking.create({
            ambulance_id,
            emergency_request_id: emergency_request_id || null,
            location: makePoint(latNum, lngNum),
            recorded_at: new Date(),
        }, t ? { transaction: t } : undefined);

        if (t) {
            await t.commit();
        }

        // TC05: Broadcast vị trí xe vào đúng room của ca cấp cứu
        if (emergency_request_id) {
            emitTrackingUpdate({
                ambulance_id,
                emergency_request_id,
                // Keep both naming styles for compatibility (unit tests + frontend).
                lat: latNum,
                lng: lngNum,
                latitude: latNum,
                longitude: lngNum,
                timestamp: trackingRecord.recorded_at,
            });
        }

        return trackingRecord;
    } catch (error) {
        if (t) {
            await t.rollback();
        }
        throw error;
    }
};

const getHistory = async (ambulance_id, facility_id, role_id, limit = 50) => {
    const ambulance = await Ambulance.findByPk(ambulance_id);
    if (!ambulance) throw new AppError('Không tìm thấy xe cứu thương', 404);

    if (role_id === 2 && ambulance.facility_id !== facility_id) {
        throw new AppError('Bạn không có quyền xem track của xe bệnh viện khác', 403);
    }

    return await AmbulanceTracking.findAll({
        where: { ambulance_id },
        attributes: [
            'id',
            'ambulance_id',
            'emergency_request_id',
            'recorded_at',
            selectGeoJSON('location', 'location'),
        ],
        order: [['recorded_at', 'DESC']],
        limit,
    });
};

module.exports = {
    recordGPS,
    getHistory,
};
