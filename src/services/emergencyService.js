const { sequelize, EmergencyRequest, MedicalFacility, Ambulance } = require('../models');
const { makePoint, selectGeoJSON } = require('../utils/geoHelpers');
const AppError = require('../utils/AppError');

const createSOS = async (requester_id, lat, lng, notes) => {
  if (!lat || !lng) throw new AppError('Cần cung cấp tòa độ vị trí bệnh nhân', 400);

  // Tìm bệnh viện gần nhất (type = 'hospital')
  const query = `
    SELECT id, ST_Distance(location_geom, ST_GeogFromText('POINT(:lng :lat)')) AS distance_meters
    FROM medical_facility
    WHERE is_active = true AND type = 'hospital'
    ORDER BY distance_meters ASC
    LIMIT 1;
  `;

  const nearestHospitals = await sequelize.query(query, {
    replacements: { lng, lat },
    type: sequelize.QueryTypes.SELECT
  });

  if (nearestHospitals.length === 0) {
    throw new AppError('Không tìm thấy bệnh viện nào có thể tiếp nhận hiện tại', 404);
  }

  const assignedFacility = nearestHospitals[0];

  // Tạo record SOS
  const sos = await EmergencyRequest.create({
    requester_id,
    patient_location: makePoint(lat, lng),
    assigned_facility_id: assignedFacility.id,
    status: 'pending',
    distance_meters: assignedFacility.distance_meters,
    notes: notes || ''
  });

  return sos;
};

const getRequests = async (facility_id, role_id) => {
  const whereClause = {};
  
  // Nếu là Admin trực ban, chỉ lấy SOS của bệnh viện họ
  if (role_id === 2 && facility_id) {
    whereClause.assigned_facility_id = facility_id;
  }

  return await EmergencyRequest.findAll({
    where: whereClause,
    attributes: [
      'id', 'requester_id', 'assigned_facility_id', 'assigned_ambulance_id',
      'status', 'distance_meters', 'notes', 'created_at',
      selectGeoJSON('patient_location', 'location')
    ],
    order: [['created_at', 'DESC']]
  });
};

const assignAmbulance = async (emergency_id, ambulance_id, facility_id, role_id) => {
  const emergency = await EmergencyRequest.findByPk(emergency_id);
  if (!emergency) throw new AppError('Không tìm thấy yêu cầu cấp cứu', 404);

  // Kiểm tra quyền
  if (role_id === 2 && emergency.assigned_facility_id !== facility_id) {
    throw new AppError('Bạn không có quyền quản lý ca cấp cứu này', 403);
  }

  const ambulance = await Ambulance.findByPk(ambulance_id);
  if (!ambulance || ambulance.facility_id !== emergency.assigned_facility_id) {
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
  const emergency = await EmergencyRequest.findByPk(emergency_id);
  if (!emergency) throw new AppError('Không tìm thấy yêu cầu cấp cứu', 404);

  if (role_id === 2 && emergency.assigned_facility_id !== facility_id) {
    throw new AppError('Bạn không có quyền quản lý ca cấp cứu này', 403);
  }

  const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Trạng thái không hợp lệ', 400);
  }

  const t = await sequelize.transaction();
  try {
    emergency.status = status;
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
    return emergency;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

module.exports = {
  createSOS,
  getRequests,
  assignAmbulance,
  updateStatus
};
