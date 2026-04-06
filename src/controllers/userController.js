const userService = require('../services/userService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Joi = require('joi');

const createUser = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
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

module.exports = { createUser, getUsers };
