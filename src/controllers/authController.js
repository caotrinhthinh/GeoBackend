const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Joi = require('joi');

const login = catchAsync(async (req, res, next) => {
    // 1. Validate Input
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
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
        data: result,
    });
});

const register = catchAsync(async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }

    const result = await authService.register(value.email, value.password);
    res.status(201).json({
        status: 'success',
        data: result,
    });
});

const googleLogin = catchAsync(async (req, res, next) => {
    const schema = Joi.object({
        id_token: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }

    const result = await authService.googleLogin(value.id_token);
    res.status(200).json({
        status: 'success',
        data: result,
    });
});

const linkGuestAccount = catchAsync(async (req, res, next) => {
    const schema = Joi.object({
        guest_uuid: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }

    const result = await authService.linkGuestAccount(req.user.id, value.guest_uuid);

    res.status(200).json({
        status: 'success',
        data: result,
    });
});

const refreshToken = catchAsync(async (req, res, next) => {
    const schema = Joi.object({
        refresh_token: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }

    const result = await authService.refreshAccessToken(value.refresh_token);

    res.status(200).json({
        status: 'success',
        data: result,
    });
});

module.exports = {
    login,
    register,
    googleLogin,
    linkGuestAccount,
    refreshToken,
};
