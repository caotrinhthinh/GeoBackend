const { sequelize, Ambulance, EmergencyRequest, MedicalFacility } = require('../models');
const AppError = require('../utils/AppError');
const { makePoint } = require('../utils/geoHelpers');
const { getRouteLineString, toPointObject } = require('./routeService');
const { recordGPS } = require('./trackingService');
const { closeEmergencyRoom, emitTrackingUpdate } = require('../config/socket');

const activeSimulations = new Map();

const clearSimulation = (ambulanceId) => {
  const existingTimer = activeSimulations.get(Number(ambulanceId));
  if (existingTimer) {
    clearInterval(existingTimer);
    activeSimulations.delete(Number(ambulanceId));
  }
};

const startSimulation = async (ambulanceId, emergencyRequestId, options = {}) => {
  const ambulance = await Ambulance.findByPk(ambulanceId);
  if (!ambulance) {
    throw new AppError('Không tìm thấy xe cứu thương', 404);
  }

  const ambulanceWithLocation = await Ambulance.findByPk(ambulanceId, {
    attributes: [
      'id',
      'facility_id',
      [sequelize.fn('ST_AsGeoJSON', sequelize.cast(sequelize.col('current_location'), 'geometry')), 'current_location'],
    ],
  });

  const emergency = await EmergencyRequest.findByPk(emergencyRequestId);
  if (!emergency) {
    throw new AppError('Không tìm thấy yêu cầu cấp cứu', 404);
  }

  const emergencyWithLocation = await EmergencyRequest.findByPk(emergencyRequestId, {
    attributes: [
      'id',
      [sequelize.fn('ST_AsGeoJSON', sequelize.cast(sequelize.col('patient_location'), 'geometry')), 'patient_location'],
    ],
  });

  const facility = await MedicalFacility.findByPk(ambulance.facility_id, {
    attributes: [
      'id',
      [sequelize.fn('ST_AsGeoJSON', sequelize.cast(sequelize.col('location_geom'), 'geometry')), 'location_geom'],
    ],
  });
  if (!facility) {
    throw new AppError('Không tìm thấy bệnh viện quản lý xe cứu thương', 404);
  }

  const facilityPoint = toPointObject(facility.get('location_geom'));
  const startPoint = facilityPoint || toPointObject(ambulanceWithLocation.get('current_location'));
  const endPoint = toPointObject(emergencyWithLocation.get('patient_location'));

  if (!startPoint || !endPoint) {
    throw new AppError('Thiếu tọa độ để giả lập hành trình', 400);
  }

  // Always start simulation from hospital to avoid stale ambulance location
  // from previous runs causing instant completion on a new dispatch.
  if (facilityPoint && typeof sequelize?.literal === 'function') {
    ambulance.current_location = makePoint(facilityPoint.lat, facilityPoint.lng);
    await ambulance.save();
  }

  const route = await getRouteLineString(startPoint, endPoint);
  const coordinates = route.lineString.coordinates;

  if (!coordinates.length) {
    throw new AppError('Không tạo được đường đi mô phỏng', 500);
  }

  clearSimulation(ambulanceId);

  const intervalMs = options.intervalMs || 3000;
  let stepIndex = 0;

  const timer = setInterval(async () => {
    const coordinate = coordinates[Math.min(stepIndex, coordinates.length - 1)];
    stepIndex += 1;

    try {
      await recordGPS(ambulanceId, coordinate[1], coordinate[0], emergencyRequestId);

      if (stepIndex >= coordinates.length) {
        // Failsafe: when the route simulation reaches its final point, force
        // completion if the request is still active.
        const emergencyAtFinish = await EmergencyRequest.findByPk(emergencyRequestId);
        if (
          emergencyAtFinish &&
          (emergencyAtFinish.status === 'assigned' || emergencyAtFinish.status === 'in_progress')
        ) {
          emergencyAtFinish.status = 'completed';
          emergencyAtFinish.done_at = new Date();
          await emergencyAtFinish.save();
        }

        const ambulanceAtFinish = await Ambulance.findByPk(ambulanceId);
        if (ambulanceAtFinish && ambulanceAtFinish.status !== 'available') {
          ambulanceAtFinish.status = 'available';
          await ambulanceAtFinish.save();
        }

        // Emit a final status update before closing the room so dashboards
        // can reflect "Hoàn thành" immediately.
        emitTrackingUpdate({
          ambulance_id: Number(ambulanceId),
          emergency_request_id: Number(emergencyRequestId),
          lat: coordinate[1],
          lng: coordinate[0],
          latitude: coordinate[1],
          longitude: coordinate[0],
          timestamp: new Date(),
          status: 'COMPLETED',
        });

        closeEmergencyRoom(emergencyRequestId);
        clearSimulation(ambulanceId);
      }
    } catch (error) {
      clearSimulation(ambulanceId);
      console.error('Simulation stopped because recording GPS failed:', error);
    }
  }, intervalMs);

  activeSimulations.set(Number(ambulanceId), timer);

  return {
    ambulance_id: Number(ambulanceId),
    emergency_request_id: Number(emergencyRequestId),
    interval_ms: intervalMs,
    total_points: coordinates.length,
    route,
  };
};

const stopSimulation = async (ambulanceId) => {
  clearSimulation(ambulanceId);
  return {
    ambulance_id: Number(ambulanceId),
    stopped: true,
  };
};

module.exports = {
  startSimulation,
  stopSimulation,
  clearSimulation,
};