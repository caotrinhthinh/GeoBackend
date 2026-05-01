const Joi = require('joi');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const profileService = require('../services/profileService');

const profileSchema = Joi.object({
  full_name: Joi.string().max(255).allow('', null).optional(),
  age: Joi.number().integer().min(0).max(120).allow(null).optional(),
  emergency_contact_phone: Joi.string().max(20).allow('', null).optional(),
  blood_type: Joi.string().max(20).allow('', null).optional(),
  chronic_conditions: Joi.string().max(2000).allow('', null).optional(),
  allergies: Joi.string().max(2000).allow('', null).optional(),
});

const getMyProfile = catchAsync(async (req, res) => {
  const data = await profileService.getMyProfile(req.user);
  res.status(200).json({ status: 'success', data });
});

const upsertMyProfile = catchAsync(async (req, res, next) => {
  const { error, value } = profileSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const data = await profileService.upsertMyProfile(req.user, value);
  res.status(200).json({ status: 'success', data });
});

module.exports = {
  getMyProfile,
  upsertMyProfile,
};
