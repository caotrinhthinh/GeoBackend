const trackingService = require('../services/trackingService');
const trackingSimulationService = require('../services/trackingSimulationService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Joi = require('joi');

const recordGPS = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    ambulance_id: Joi.number().required(),
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    emergency_request_id: Joi.number().optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const trackingRecord = await trackingService.recordGPS(
    value.ambulance_id, 
    value.lat, 
    value.lng, 
    value.emergency_request_id,
    req.user.facility_id,
    req.user.role_id
  );

  res.status(201).json({ status: 'success', data: trackingRecord });
});

const getHistory = catchAsync(async (req, res, next) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;

  const result = await trackingService.getHistory(
    req.params.ambulanceId,
    req.user.facility_id,
    req.user.role_id,
    limit
  );

  const data = result.map(t => {
    let loc = t.get('location');
    if (typeof loc === 'string') loc = JSON.parse(loc);
    return { ...t.dataValues, location: loc };
  });

  res.status(200).json({ status: 'success', results: data.length, data });
});

const startSimulation = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    ambulance_id: Joi.number().required(),
    emergency_request_id: Joi.number().required(),
    interval_ms: Joi.number().min(1000).optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const result = await trackingSimulationService.startSimulation(
    value.ambulance_id,
    value.emergency_request_id,
    { intervalMs: value.interval_ms },
  );

  res.status(200).json({ status: 'success', data: result });
});

const stopSimulation = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    ambulance_id: Joi.number().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const result = await trackingSimulationService.stopSimulation(value.ambulance_id);

  res.status(200).json({ status: 'success', data: result });
});

module.exports = {
  recordGPS,
  getHistory,
  startSimulation,
  stopSimulation,
};
