const trackingService = require("../services/trackingService");
const trackingSimulatorService = require("../services/trackingSimulatorService");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const Joi = require("joi");

const recordGPS = catchAsync(async (req, res, next) => {
    const schema = Joi.object({
        ambulance_id: Joi.number().required(),
        lat: Joi.number().required(),
        lng: Joi.number().required(),
        emergency_request_id: Joi.number().optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));

    const trackingRecord = await trackingService.recordGPS(
        value.ambulance_id,
        value.lat,
        value.lng,
        value.emergency_request_id,
        req.user.facility_id,
        req.user.role_id,
    );

    res.status(201).json({ status: "success", data: trackingRecord });
});

const getHistory = catchAsync(async (req, res, next) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    const result = await trackingService.getHistory(
        req.params.ambulanceId,
        req.user.facility_id,
        req.user.role_id,
        limit,
    );

    const data = result.history;

    res.status(200).json({
        status: "success",
        results: data.length,
        data,
        line_string: result.line_string,
    });
});

const startSimulation = catchAsync(async (req, res, next) => {
    const schema = Joi.object({
        emergency_request_id: Joi.number().integer().positive().required(),
        interval_seconds: Joi.number().min(3).max(5).optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));

    const result = await trackingSimulatorService.startSimulation({
        emergency_request_id: value.emergency_request_id,
        interval_seconds: value.interval_seconds,
        facility_id: req.user.facility_id,
        role_id: req.user.role_id,
    });

    res.status(201).json({ status: "success", data: result });
});

const stopSimulation = catchAsync(async (req, res, next) => {
    const schema = Joi.object({
        simulation_id: Joi.string().trim().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));

    const result = await trackingSimulatorService.stopSimulation({
        simulation_id: value.simulation_id,
        facility_id: req.user.facility_id,
        role_id: req.user.role_id,
    });

    res.status(200).json({ status: "success", data: result });
});

const getSimulationStatus = catchAsync(async (req, res, next) => {
    const result = await trackingSimulatorService.getSimulationStatus({
        simulation_id: req.params.simulationId,
        facility_id: req.user.facility_id,
        role_id: req.user.role_id,
    });

    res.status(200).json({ status: "success", data: result });
});

module.exports = {
    recordGPS,
    getHistory,
    startSimulation,
    stopSimulation,
    getSimulationStatus,
};
