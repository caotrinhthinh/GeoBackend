const emergencyService = require('../services/emergencyService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Joi = require('joi');
const jwt = require('jsonwebtoken');

const createSOS = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    notes: Joi.string().allow('', null).optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const requester_id = req.user ? req.user.id : null;
  const sos = await emergencyService.createSOS(requester_id, value.lat, value.lng, value.notes);
  
  // Tạo tracking token cho guest (hết hạn sau 1 giờ)
  const tracking_token = jwt.sign(
    { request_id: sos.id, role: 'guest_tracker' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.status(201).json({ status: 'success', data: sos, tracking_token });
});

const getRequests = catchAsync(async (req, res, next) => {
  const result = await emergencyService.getRequests(req.user.facility_id, req.user.role_id);
  const data = result.map(e => {
    let loc = e.get('location');
    if (typeof loc === 'string') loc = JSON.parse(loc);
    return { ...e.dataValues, location: loc };
  });

  res.status(200).json({ status: 'success', results: data.length, data });
});

const assignAmbulance = catchAsync(async (req, res, next) => {
  const { ambulance_id } = req.body;
  if (!ambulance_id) {
    return next(new AppError('Cần cung cấp ambulance_id để điều động', 400));
  }
  
  const emergency = await emergencyService.assignAmbulance(
    req.params.id, 
    ambulance_id, 
    req.user.facility_id, 
    req.user.role_id
  );

  res.status(200).json({ status: 'success', data: emergency });
});

const updateStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  const emergency = await emergencyService.updateStatus(
    req.params.id, 
    status, 
    req.user.facility_id, 
    req.user.role_id
  );

  res.status(200).json({ status: 'success', data: emergency });
});

module.exports = {
  createSOS,
  getRequests,
  assignAmbulance,
  updateStatus
};
