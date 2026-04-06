const { Ambulance, MedicalFacility } = require('../models');
const { selectGeoJSON, makePoint } = require('../utils/geoHelpers');
const AppError = require('../utils/AppError');

const getAmbulancesByFacility = async (facility_id) => {
  return await Ambulance.findAll({
    where: { facility_id },
    attributes: [
      'id', 'plate_number', 'status', 'facility_id',
      selectGeoJSON('current_location', 'location')
    ],
    include: [{ model: MedicalFacility, attributes: ['name'] }]
  });
};

const createAmbulance = async (data) => {
  const { plate_number, facility_id, status } = data;
  
  const existingAmbulance = await Ambulance.findOne({ where: { plate_number } });
  if (existingAmbulance) {
    throw new AppError('Biển số xe cứu thương đã tồn tại', 400);
  }

  const facility = await MedicalFacility.findByPk(facility_id);
  if (!facility || facility.type !== 'hospital') {
    throw new AppError('Cơ sở y tế không hợp lệ hoặc không phải bệnh viện', 400);
  }

  // Khởi tạo xe ở trạng thái available và vị trí là của bệnh viện
  return await Ambulance.create({
    plate_number,
    facility_id,
    status: status || 'available',
    current_location: facility.location_geom
  });
};

const updateStatus = async (id, status, facility_id, role_id) => {
  const ambulance = await Ambulance.findByPk(id);
  if (!ambulance) throw new AppError('Không tìm thấy xe cứu thương', 404);

  // Chỉ Admin trực ban của bệnh viện đó hoặc SuperAdmin mới được sửa
  if (role_id === 2 && ambulance.facility_id !== facility_id) {
    throw new AppError('Bạn không có quyền cập nhật xe của bệnh viện khác', 403);
  }

  ambulance.status = status;
  await ambulance.save();
  return ambulance;
};

const updateLocation = async (id, lat, lng, facility_id, role_id) => {
  if (!lat || !lng) throw new AppError('Cần cung cấp lat và lng', 400);

  const ambulance = await Ambulance.findByPk(id);
  if (!ambulance) throw new AppError('Không tìm thấy xe cứu thương', 404);

  if (role_id === 2 && ambulance.facility_id !== facility_id) {
    throw new AppError('Bạn không có quyền cập nhật xe của bệnh viện khác', 403);
  }

  ambulance.current_location = makePoint(lat, lng);
  await ambulance.save();
  return ambulance;
};

module.exports = {
  getAmbulancesByFacility,
  createAmbulance,
  updateStatus,
  updateLocation
};
