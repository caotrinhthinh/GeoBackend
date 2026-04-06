const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Joi = require('joi');

const login = catchAsync(async (req, res, next) => {
  // 1. Validate Input
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  // 2. Call service
  const result = await authService.login(value.email, value.password);

  // 3. Send response
  res.status(200).json({
    status: 'success',
    data: result
  });
});

module.exports = {
  login
};
