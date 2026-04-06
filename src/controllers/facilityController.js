const facilityService = require('../services/facilityService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Joi = require('joi');

const getAllFacilities = catchAsync(async (req, res, next) => {
  const result = await facilityService.getAllFacilities();
  // Decode parsed GeoJSON strings if they were strings (Postgres driver sometimes returns JSON strings when ST_AsGeoJSON is used)
  const data = result.map(f => {
    let loc = f.get('location');
    if (typeof loc === 'string') loc = JSON.parse(loc);
    return { ...f.dataValues, location: loc };
  });
  
  res.status(200).json({ status: 'success', results: data.length, data });
});

const getNearbyFacilities = catchAsync(async (req, res, next) => {
  const { lat, lng, radius } = req.query;
  const results = await facilityService.getNearbyFacilities(lat, lng, radius);
  
  // parse geojson strings
  const data = results.map(f => ({
    ...f,
    location: typeof f.location === 'string' ? JSON.parse(f.location) : f.location
  }));

  res.status(200).json({ status: 'success', results: data.length, data });
});

const createFacility = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('hospital', 'pharmacy').required(),
    address: Joi.string().optional(),
    phone: Joi.string().optional(),
    lat: Joi.number().required(),
    lng: Joi.number().required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const newFacility = await facilityService.createFacility(value);
  res.status(201).json({ status: 'success', data: newFacility });
});

const updateFacility = catchAsync(async (req, res, next) => {
  const updatedFacility = await facilityService.updateFacility(req.params.id, req.body);
  res.status(200).json({ status: 'success', data: updatedFacility });
});

const deleteFacility = catchAsync(async (req, res, next) => {
  await facilityService.deleteFacility(req.params.id);
  res.status(204).send();
});

module.exports = {
  getAllFacilities,
  getNearbyFacilities,
  createFacility,
  updateFacility,
  deleteFacility
};
