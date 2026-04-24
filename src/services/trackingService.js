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

    // Use a transaction so location update, tracking log and optional emergency status update are atomic
    const t = await Ambulance.sequelize.transaction();
    try {
        // Update current location in ambulance table
        ambulance.current_location = makePoint(latNum, lngNum);
        await ambulance.save({ transaction: t });

        // If this tracking message is tied to an emergency, and that emergency is currently 'assigned', mark it 'in_progress'
        if (emergency_request_id) {
            const emergency = await EmergencyRequest.findByPk(emergency_request_id, { transaction: t });
            if (emergency && emergency.status === 'assigned') {
                emergency.status = 'in_progress';
                await emergency.save({ transaction: t });
            }
        }

        // Create log entry in tracking table
        const trackingRecord = await AmbulanceTracking.create({
            ambulance_id,
            emergency_request_id: emergency_request_id || null,
            location: makePoint(latNum, lngNum),
            recorded_at: new Date(),
        }, { transaction: t });

        await t.commit();
        return trackingRecord;
    } catch (error) {
        await t.rollback();
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
