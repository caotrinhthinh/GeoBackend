const { AmbulanceTracking, Ambulance, EmergencyRequest } = require('../models');
const { makePoint, selectGeoJSON } = require('../utils/geoHelpers');
const AppError = require('../utils/AppError');

const recordGPS = async (ambulance_id, lat, lng, emergency_request_id, facility_id, role_id) => {
  if (!lat || !lng) throw new AppError('Cần cung cấp lat và lng', 400);

  const ambulance = await Ambulance.findByPk(ambulance_id);
  if (!ambulance) throw new AppError('Không tìm thấy xe cứu thương', 404);

  if (role_id === 2 && ambulance.facility_id !== facility_id) {
    throw new AppError('Bạn không có quyền log GPS cho xe của bệnh viện khác', 403);
  }

  // Update current location in ambulance table
  ambulance.current_location = makePoint(lat, lng);
  await ambulance.save();

  // Create log entry in tracking table
  const trackingRecord = await AmbulanceTracking.create({
    ambulance_id,
    emergency_request_id: emergency_request_id || null,
    location: makePoint(lat, lng),
    recorded_at: new Date()
  });

  return trackingRecord;
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
      'id', 'ambulance_id', 'emergency_request_id', 'recorded_at',
      selectGeoJSON('location', 'location')
    ],
    order: [['recorded_at', 'DESC']],
    limit
  });
};

module.exports = {
  recordGPS,
  getHistory
};
