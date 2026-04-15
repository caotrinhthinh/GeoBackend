const AppError = require('./AppError');

const toFiniteNumber = (value) => {
    if (value === null || value === undefined) return NaN;
    if (typeof value === 'string' && value.trim() === '') return NaN;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
};

const parseCoordinatePair = (lat, lng, message = 'Invalid coordinates') => {
    const latNum = toFiniteNumber(lat);
    const lngNum = toFiniteNumber(lng);

    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
        throw new AppError(message, 400);
    }

    return { latNum, lngNum };
};

module.exports = {
    parseCoordinatePair,
};
