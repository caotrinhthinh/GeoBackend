const { sequelize } = require("../models");
const AppError = require("../utils/AppError");
const osrmService = require("./osrmService");
const trackingService = require("./trackingService");

const MIN_INTERVAL_SECONDS = 3;
const MAX_INTERVAL_SECONDS = 5;
const MAX_SIMULATION_POINTS = 120;

const activeSimulations = new Map();

const parseCoordinateNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const buildPointTimeline = (lineStringCoordinates) => {
    if (!Array.isArray(lineStringCoordinates) || lineStringCoordinates.length === 0) {
        return [];
    }

    if (lineStringCoordinates.length <= MAX_SIMULATION_POINTS) {
        return lineStringCoordinates;
    }

    const step = Math.ceil(lineStringCoordinates.length / MAX_SIMULATION_POINTS);
    const reduced = [];

    for (let index = 0; index < lineStringCoordinates.length; index += step) {
        reduced.push(lineStringCoordinates[index]);
    }

    const lastPoint = lineStringCoordinates[lineStringCoordinates.length - 1];
    const reducedLastPoint = reduced[reduced.length - 1];

    if (!reducedLastPoint || reducedLastPoint[0] !== lastPoint[0] || reducedLastPoint[1] !== lastPoint[1]) {
        reduced.push(lastPoint);
    }

    return reduced;
};

const loadEmergencyForSimulation = async (emergencyRequestId) => {
    const query = `
    SELECT
      e.id,
      e.requester_id,
      e.assigned_facility_id,
      e.assigned_ambulance_id,
      ST_Y(CAST(e.patient_location AS geometry)) AS patient_lat,
      ST_X(CAST(e.patient_location AS geometry)) AS patient_lng,
      ST_Y(CAST(a.current_location AS geometry)) AS ambulance_lat,
      ST_X(CAST(a.current_location AS geometry)) AS ambulance_lng
    FROM emergency_request e
    LEFT JOIN ambulance a ON a.id = e.assigned_ambulance_id
    WHERE e.id = :emergencyRequestId
    LIMIT 1;
  `;

    const rows = await sequelize.query(query, {
        replacements: { emergencyRequestId },
        type: sequelize.QueryTypes.SELECT,
    });

    if (rows.length === 0) {
        throw new AppError("Emergency request not found", 404);
    }

    const emergency = rows[0];

    if (!emergency.assigned_ambulance_id) {
        throw new AppError("Emergency request does not have an assigned ambulance", 400);
    }

    const ambulanceLat = parseCoordinateNumber(emergency.ambulance_lat);
    const ambulanceLng = parseCoordinateNumber(emergency.ambulance_lng);
    const patientLat = parseCoordinateNumber(emergency.patient_lat);
    const patientLng = parseCoordinateNumber(emergency.patient_lng);

    if (ambulanceLat === null || ambulanceLng === null || patientLat === null || patientLng === null) {
        throw new AppError("Cannot calculate route due to missing coordinates", 400);
    }

    return {
        id: emergency.id,
        requester_id: emergency.requester_id,
        assigned_facility_id: emergency.assigned_facility_id,
        assigned_ambulance_id: emergency.assigned_ambulance_id,
        ambulance: { lat: ambulanceLat, lng: ambulanceLng },
        patient: { lat: patientLat, lng: patientLng },
    };
};

const authorizeEmergencyAccess = (emergency, facilityId, roleId) => {
    if (roleId === 2 && emergency.assigned_facility_id !== facilityId) {
        throw new AppError("You are not allowed to manage this emergency request", 403);
    }
};

const authorizeSimulationAccess = (simulation, facilityId, roleId) => {
    if (roleId === 2 && simulation.assigned_facility_id !== facilityId) {
        throw new AppError("You are not allowed to access this simulation", 403);
    }
};

const stopById = (simulationId, status, reason) => {
    const simulation = activeSimulations.get(simulationId);
    if (!simulation) {
        return null;
    }

    if (simulation.interval_handle) {
        clearInterval(simulation.interval_handle);
        simulation.interval_handle = null;
    }

    simulation.status = status || simulation.status;
    simulation.stopped_reason = reason || simulation.stopped_reason;
    simulation.stopped_at = new Date();

    return simulation;
};

const startSimulation = async ({ emergency_request_id, interval_seconds, facility_id, role_id }) => {
    const emergencyRequestId = Number(emergency_request_id);
    const intervalSeconds = Number(interval_seconds || MIN_INTERVAL_SECONDS);

    if (!Number.isInteger(emergencyRequestId) || emergencyRequestId <= 0) {
        throw new AppError("emergency_request_id must be a positive integer", 400);
    }

    if (
        !Number.isFinite(intervalSeconds) ||
        intervalSeconds < MIN_INTERVAL_SECONDS ||
        intervalSeconds > MAX_INTERVAL_SECONDS
    ) {
        throw new AppError(`interval_seconds must be between ${MIN_INTERVAL_SECONDS} and ${MAX_INTERVAL_SECONDS}`, 400);
    }

    const runningSimulation = Array.from(activeSimulations.values()).find((simulation) => {
        return simulation.emergency_request_id === emergencyRequestId && simulation.status === "running";
    });

    if (runningSimulation) {
        throw new AppError("A simulation is already running for this emergency request", 409);
    }

    const emergency = await loadEmergencyForSimulation(emergencyRequestId);
    authorizeEmergencyAccess(emergency, facility_id, role_id);

    const route = await osrmService.getOptimalRoute(emergency.ambulance, emergency.patient);
    const timeline = buildPointTimeline(route.line_string.coordinates);

    if (timeline.length === 0) {
        throw new AppError("No valid route points generated for simulation", 500);
    }

    const simulationId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const intervalMs = Math.round(intervalSeconds * 1000);

    const simulation = {
        id: simulationId,
        emergency_request_id: emergency.id,
        ambulance_id: emergency.assigned_ambulance_id,
        assigned_facility_id: emergency.assigned_facility_id,
        interval_seconds: intervalSeconds,
        total_points: timeline.length,
        sent_points: 0,
        current_index: 0,
        status: "running",
        last_error: null,
        started_at: new Date(),
        stopped_at: null,
        stopped_reason: null,
        line_string: route.line_string,
        distance_meters: route.distance_meters,
        duration_seconds: route.duration_seconds,
        interval_handle: null,
        ticking: false,
    };

    activeSimulations.set(simulationId, simulation);

    const executeTick = async () => {
        const currentSimulation = activeSimulations.get(simulationId);
        if (!currentSimulation || currentSimulation.status !== "running") {
            return;
        }

        if (currentSimulation.ticking) {
            return;
        }

        currentSimulation.ticking = true;

        try {
            if (currentSimulation.current_index >= timeline.length) {
                stopById(simulationId, "completed", "All route points sent");
                return;
            }

            const [lng, lat] = timeline[currentSimulation.current_index];

            await trackingService.recordGPS(
                currentSimulation.ambulance_id,
                Number(lat),
                Number(lng),
                currentSimulation.emergency_request_id,
                facility_id,
                role_id,
                { skipPermissionCheck: true },
            );

            currentSimulation.current_index += 1;
            currentSimulation.sent_points += 1;

            if (currentSimulation.current_index >= timeline.length) {
                stopById(simulationId, "completed", "All route points sent");
            }
        } catch (error) {
            const currentSimulationAfterError = activeSimulations.get(simulationId);
            if (currentSimulationAfterError) {
                currentSimulationAfterError.last_error = error.message;
            }
            stopById(simulationId, "failed", "Simulation stopped because of an error");
        } finally {
            const currentSimulationFinally = activeSimulations.get(simulationId);
            if (currentSimulationFinally) {
                currentSimulationFinally.ticking = false;
            }
        }
    };

    await executeTick();

    if (simulation.status === "running") {
        simulation.interval_handle = setInterval(() => {
            executeTick().catch((error) => {
                const currentSimulation = activeSimulations.get(simulationId);
                if (currentSimulation) {
                    currentSimulation.last_error = error.message;
                }
                stopById(simulationId, "failed", "Simulation interval execution failed");
            });
        }, intervalMs);
    }

    return {
        simulation_id: simulation.id,
        emergency_request_id: simulation.emergency_request_id,
        ambulance_id: simulation.ambulance_id,
        status: simulation.status,
        interval_seconds: simulation.interval_seconds,
        sent_points: simulation.sent_points,
        total_points: simulation.total_points,
        route: {
            line_string: simulation.line_string,
            distance_meters: simulation.distance_meters,
            duration_seconds: simulation.duration_seconds,
        },
        started_at: simulation.started_at,
    };
};

const stopSimulation = async ({ simulation_id, facility_id, role_id }) => {
    const simulationId = String(simulation_id || "").trim();

    if (!simulationId) {
        throw new AppError("simulation_id is required", 400);
    }

    const simulation = activeSimulations.get(simulationId);
    if (!simulation) {
        throw new AppError("Simulation not found", 404);
    }

    authorizeSimulationAccess(simulation, facility_id, role_id);

    stopById(simulationId, "stopped", "Stopped manually");

    return {
        simulation_id: simulation.id,
        emergency_request_id: simulation.emergency_request_id,
        status: simulation.status,
        sent_points: simulation.sent_points,
        total_points: simulation.total_points,
        stopped_at: simulation.stopped_at,
        stopped_reason: simulation.stopped_reason,
        last_error: simulation.last_error,
    };
};

const getSimulationStatus = async ({ simulation_id, facility_id, role_id }) => {
    const simulationId = String(simulation_id || "").trim();

    if (!simulationId) {
        throw new AppError("simulation_id is required", 400);
    }

    const simulation = activeSimulations.get(simulationId);
    if (!simulation) {
        throw new AppError("Simulation not found", 404);
    }

    authorizeSimulationAccess(simulation, facility_id, role_id);

    return {
        simulation_id: simulation.id,
        emergency_request_id: simulation.emergency_request_id,
        ambulance_id: simulation.ambulance_id,
        status: simulation.status,
        interval_seconds: simulation.interval_seconds,
        sent_points: simulation.sent_points,
        total_points: simulation.total_points,
        started_at: simulation.started_at,
        stopped_at: simulation.stopped_at,
        stopped_reason: simulation.stopped_reason,
        last_error: simulation.last_error,
    };
};

module.exports = {
    startSimulation,
    stopSimulation,
    getSimulationStatus,
    buildPointTimeline,
};
