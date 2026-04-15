const ambulanceService = require('../services/ambulanceService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Joi = require('joi');

const getAmbulances = catchAsync(async (req, res, next) => {
    // Role 2 luôn chỉ xem xe của bệnh viện mình.
    // Role 1 có thể xem toàn bộ nếu không truyền facility_id, hoặc lọc theo facility_id nếu có.
    if (req.user.role_id === 2) {
        const result = await ambulanceService.getAmbulancesByFacility(req.user.facility_id);
        const data = result.map((a) => {
            let loc = a.get('location');
            if (typeof loc === 'string') loc = JSON.parse(loc);
            return { ...a.dataValues, location: loc };
        });

        return res.status(200).json({ status: 'success', results: data.length, data });
    }

    const { facility_id } = req.query;

    if (facility_id) {
        const facilityIdNum = Number(facility_id);
        if (Number.isNaN(facilityIdNum)) {
            return next(new AppError('facility_id không hợp lệ', 400));
        }

        const result = await ambulanceService.getAmbulancesByFacility(facilityIdNum);
        const data = result.map((a) => {
            let loc = a.get('location');
            if (typeof loc === 'string') loc = JSON.parse(loc);
            return { ...a.dataValues, location: loc };
        });

        return res.status(200).json({ status: 'success', results: data.length, data });
    }

    const result = await ambulanceService.getAllAmbulances();
    const data = result.map((a) => {
        let loc = a.get('location');
        if (typeof loc === 'string') loc = JSON.parse(loc);
        return { ...a.dataValues, location: loc };
    });

    res.status(200).json({ status: 'success', results: data.length, data });
});

const createAmbulance = catchAsync(async (req, res, next) => {
    const schema = Joi.object({
        plate_number: Joi.string().required(),
        facility_id: Joi.number().required(),
        status: Joi.string().valid('available', 'dispatched', 'maintenance').optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));

    // Role 2 chỉ được tạo xe cho bệnh viện của mình
    if (req.user.role_id === 2 && value.facility_id !== req.user.facility_id) {
        return next(new AppError('Bạn chỉ được thêm xe cho bệnh viện của mình', 403));
    }

    const ambulance = await ambulanceService.createAmbulance(value);
    res.status(201).json({ status: 'success', data: ambulance });
});

const updateStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;
    if (!['available', 'dispatched', 'maintenance'].includes(status)) {
        return next(new AppError('Status không hợp lệ', 400));
    }

    const ambulance = await ambulanceService.updateStatus(
        req.params.id,
        status,
        req.user.facility_id,
        req.user.role_id,
    );
    res.status(200).json({ status: 'success', data: ambulance });
});

const updateLocation = catchAsync(async (req, res, next) => {
    const { lat, lng } = req.body;
    const ambulance = await ambulanceService.updateLocation(
        req.params.id,
        lat,
        lng,
        req.user.facility_id,
        req.user.role_id,
    );
    res.status(200).json({ status: 'success', data: ambulance });
});

module.exports = {
    getAmbulances,
    createAmbulance,
    updateStatus,
    updateLocation,
};
