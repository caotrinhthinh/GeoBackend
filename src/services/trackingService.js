const { sequelize, AmbulanceTracking, Ambulance, EmergencyRequest } = require('../models');
const { makePoint, selectGeoJSON } = require('../utils/geoHelpers');
const AppError = require('../utils/AppError');
const { parseCoordinatePair } = require('../utils/coordinateUtils');
const { emitTrackingUpdate, closeEmergencyRoom } = require('../config/socket');
const { toPointObject } = require('./routeService');

const AUTO_COMPLETE_RADIUS_METERS = 90;

function haversineDistanceMeters(start, end) {
    const radiusMeters = 6371000;
    const toRadians = (degrees) => (degrees * Math.PI) / 180;

    const deltaLat = toRadians(end.lat - start.lat);
    const deltaLng = toRadians(end.lng - start.lng);
    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(toRadians(start.lat)) * Math.cos(toRadians(end.lat)) * Math.sin(deltaLng / 2) ** 2;

    return 2 * radiusMeters * Math.asin(Math.sqrt(a));
}

function toSocketStatus(status) {
    if (status === 'completed') return 'COMPLETED';
    if (status === 'in_progress') return 'ON_THE_WAY';
    if (status === 'assigned') return 'ASSIGNED';
    return undefined;
}

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

        let emergencyRouteGeometry = null;
        let shouldCloseRoom = false;
        let emittedStatus;
        let justActivatedTracking = false;

        // If this tracking message is tied to an emergency, and that emergency is currently 'assigned', mark it 'in_progress'
        if (emergency_request_id && typeof EmergencyRequest?.findByPk === 'function') {
            const emergency = t
                ? await EmergencyRequest.findByPk(emergency_request_id, {
                    attributes: [
                        'id',
                        'status',
                        'route_geometry',
                        [sequelize.fn('ST_AsGeoJSON', sequelize.cast(sequelize.col('patient_location'), 'geometry')), 'patient_location_geojson'],
                    ],
                    transaction: t,
                })
                : await EmergencyRequest.findByPk(emergency_request_id, {
                    attributes: [
                        'id',
                        'status',
                        'route_geometry',
                        [sequelize.fn('ST_AsGeoJSON', sequelize.cast(sequelize.col('patient_location'), 'geometry')), 'patient_location_geojson'],
                    ],
                });

            emergencyRouteGeometry = emergency?.route_geometry ?? null;

            if (emergency && emergency.status === 'assigned') {
                emergency.status = 'in_progress';
                justActivatedTracking = true;
                if (t) {
                    await emergency.save({ transaction: t });
                } else {
                    await emergency.save();
                }
            }

            if (
                emergency &&
                !justActivatedTracking &&
                emergency.status !== 'completed' &&
                emergency.status !== 'cancelled'
            ) {
                const patientPoint = toPointObject(emergency.get('patient_location_geojson'));
                if (patientPoint) {
                    const distanceToPatient = haversineDistanceMeters(
                        { lat: latNum, lng: lngNum },
                        patientPoint,
                    );

                    if (distanceToPatient <= AUTO_COMPLETE_RADIUS_METERS) {
                        emergency.status = 'completed';
                        emergency.done_at = new Date();
                        if (t) {
                            await emergency.save({ transaction: t });
                        } else {
                            await emergency.save();
                        }

                        if (ambulance.status !== 'available') {
                            ambulance.status = 'available';
                            if (t) {
                                await ambulance.save({ transaction: t });
                            } else {
                                await ambulance.save();
                            }
                        }

                        shouldCloseRoom = true;
                    }
                }
            }

            emittedStatus = toSocketStatus(emergency?.status);
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
                route_path: emergencyRouteGeometry,
                status: emittedStatus,
            });
        }

        if (shouldCloseRoom && emergency_request_id) {
            closeEmergencyRoom(emergency_request_id);
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
