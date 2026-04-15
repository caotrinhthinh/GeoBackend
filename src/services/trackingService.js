const { AmbulanceTracking, Ambulance, EmergencyRequest } = require("../models");
const { makePoint, selectGeoJSON } = require("../utils/geoHelpers");
const AppError = require("../utils/AppError");

const parseLocation = (location) => {
    if (!location) {
        return null;
    }

    if (typeof location === "string") {
        try {
            return JSON.parse(location);
        } catch (error) {
            return null;
        }
    }

    if (typeof location === "object") {
        return location;
    }

    return null;
};

const buildLineString = (historyRows) => {
    const coordinates = [];

    for (const row of historyRows) {
        const parsed = parseLocation(row.location);
        if (parsed && Array.isArray(parsed.coordinates) && parsed.coordinates.length === 2) {
            coordinates.push(parsed.coordinates);
        }
    }

    if (coordinates.length < 2) {
        return null;
    }

    return {
        type: "LineString",
        coordinates,
    };
};

const recordGPS = async (ambulance_id, lat, lng, emergency_request_id, facility_id, role_id, options = {}) => {
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new AppError("lat and lng are required", 400);
    }

    const ambulance = await Ambulance.findByPk(ambulance_id);
    if (!ambulance) throw new AppError("Ambulance not found", 404);

    if (!options.skipPermissionCheck && role_id === 2 && ambulance.facility_id !== facility_id) {
        throw new AppError("You are not allowed to log GPS for ambulances from another facility", 403);
    }

    if (emergency_request_id) {
        const emergency = await EmergencyRequest.findByPk(emergency_request_id);
        if (!emergency) {
            throw new AppError("Emergency request not found", 404);
        }

        if (!options.skipPermissionCheck && role_id === 2 && emergency.assigned_facility_id !== facility_id) {
            throw new AppError("You are not allowed to log GPS for this emergency request", 403);
        }
    }

    // Update current location in ambulance table
    ambulance.current_location = makePoint(latitude, longitude);
    await ambulance.save();

    // Create log entry in tracking table
    const trackingRecord = await AmbulanceTracking.create({
        ambulance_id,
        emergency_request_id: emergency_request_id || null,
        location: makePoint(latitude, longitude),
        recorded_at: new Date(),
    });

    return trackingRecord;
};

const getHistory = async (ambulance_id, facility_id, role_id, limit = 50) => {
    const ambulance = await Ambulance.findByPk(ambulance_id);
    if (!ambulance) throw new AppError("Ambulance not found", 404);

    if (role_id === 2 && ambulance.facility_id !== facility_id) {
        throw new AppError("You are not allowed to view tracking history from another facility", 403);
    }

    const parsedLimit = Number(limit);
    const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50;

    const result = await AmbulanceTracking.findAll({
        where: { ambulance_id },
        attributes: [
            "id",
            "ambulance_id",
            "emergency_request_id",
            "recorded_at",
            selectGeoJSON("location", "location"),
        ],
        order: [["recorded_at", "DESC"]],
        limit: safeLimit,
    });

    const historyRows = result.map((row) => {
        const values = row.toJSON();
        return {
            ...values,
            location: parseLocation(values.location),
        };
    });

    const orderedRows = [...historyRows].reverse();

    return {
        history: historyRows,
        line_string: buildLineString(orderedRows),
    };
};

module.exports = {
    recordGPS,
    getHistory,
};
