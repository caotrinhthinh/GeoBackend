const userService = require('../services/userService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Joi = require('joi');

const createUser = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role_id: Joi.number().valid(1, 2, 3).required(),
    facility_id: Joi.number().optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const newUser = await userService.createUser(value);
  res.status(201).json({ status: 'success', data: newUser });
});

const getUsers = catchAsync(async (req, res, next) => {
  const users = await userService.getUsers();
  res.status(200).json({ status: 'success', data: users });
});

const deactivateUser = catchAsync(async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return next(new AppError('ID không hợp lệ', 400));
  }
  const data = await userService.deactivateUserById(id, req.user.id);
  res.status(200).json({ status: 'success', data });
});

const updateHospitalAdmin = catchAsync(async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return next(new AppError('ID không hợp lệ', 400));
  }

  const schema = Joi.object({
    email: Joi.string().email().optional(),
    facility_id: Joi.number().integer().positive().optional(),
    password: Joi.string().min(8).allow('').optional(),
  }).min(1);

  const { error, value } = schema.validate(req.body, { stripUnknown: true });
  if (error) return next(new AppError(error.details[0].message, 400));

  const payload = { ...value };
  if (payload.password === '') {
    delete payload.password;
  }

  const updated = await userService.updateHospitalAdminById(id, payload);
  const plain = updated.get ? updated.get({ plain: true }) : updated;
  const { password_hash: _ph, ...safe } = plain;
  res.status(200).json({ status: 'success', data: safe });
});

const resetHospitalAdminPassword = catchAsync(async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return next(new AppError('ID không hợp lệ', 400));
  }

  const schema = Joi.object({
    password: Joi.string().min(8).optional(),
  });

  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return next(new AppError(error.details[0].message, 400));

  const data = await userService.resetHospitalAdminPasswordById(id, value.password);
  res.status(200).json({ status: 'success', data });
});

module.exports = {
  createUser,
  getUsers,
  deactivateUser,
  updateHospitalAdmin,
  resetHospitalAdminPassword,
};
