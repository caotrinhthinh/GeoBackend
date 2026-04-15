const AppError = require("../utils/AppError");

const DEFAULT_OSRM_BASE_URL = process.env.OSRM_BASE_URL || "https://router.project-osrm.org";
const DEFAULT_TIMEOUT_MS = Number(process.env.OSRM_TIMEOUT_MS || 10000);

const isValidCoordinate = (lat, lng) => {
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

const normalizeCoordinate = (label, point) => {
    const lat = Number(point?.lat);
    const lng = Number(point?.lng);

    if (!isValidCoordinate(lat, lng)) {
        throw new AppError(`Invalid ${label} coordinate`, 400);
    }

    return { lat, lng };
};

const parseOsrmRoute = (payload) => {
    if (!payload || payload.code !== "Ok" || !Array.isArray(payload.routes) || payload.routes.length === 0) {
        throw new AppError("OSRM did not return a valid route", 502);
    }

    const bestRoute = payload.routes[0];
    const geometry = bestRoute?.geometry;

    if (
        !geometry ||
        geometry.type !== "LineString" ||
        !Array.isArray(geometry.coordinates) ||
        geometry.coordinates.length < 2
    ) {
        throw new AppError("OSRM route geometry is invalid", 502);
    }

    return {
        line_string: {
            type: "LineString",
            coordinates: geometry.coordinates,
        },
        distance_meters: Number(bestRoute.distance) || 0,
        duration_seconds: Number(bestRoute.duration) || 0,
    };
};

const getOptimalRoute = async (fromPoint, toPoint) => {
    const from = normalizeCoordinate("origin", fromPoint);
    const to = normalizeCoordinate("destination", toPoint);

    const url = `${DEFAULT_OSRM_BASE_URL}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=false`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
            throw new AppError(`OSRM request failed with status ${response.status}`, 502);
        }

        const payload = await response.json();
        return parseOsrmRoute(payload);
    } catch (error) {
        if (error.name === "AbortError") {
            throw new AppError("OSRM request timeout", 504);
        }

        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(`OSRM request error: ${error.message}`, 502);
    } finally {
        clearTimeout(timeout);
    }
};

module.exports = {
    getOptimalRoute,
    parseOsrmRoute,
};
