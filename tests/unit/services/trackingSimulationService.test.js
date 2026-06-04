jest.useFakeTimers();

jest.mock('../../../src/models', () => ({
    sequelize: {
        fn: jest.fn((name, value) => ({ name, value })),
        cast: jest.fn((value, type) => ({ value, type })),
        col: jest.fn((name) => name),
    },
    Ambulance: {
        findByPk: jest.fn(),
    },
    EmergencyRequest: {
        findByPk: jest.fn(),
    },
    MedicalFacility: {
        findByPk: jest.fn(),
    },
}));

jest.mock('../../../src/services/routeService', () => ({
    getRouteLineString: jest.fn(),
    toPointObject: jest.fn((value) => value),
}));

jest.mock('../../../src/services/trackingService', () => ({
    recordGPS: jest.fn().mockResolvedValue(undefined),
}));

const { Ambulance, EmergencyRequest, MedicalFacility } = require('../../../src/models');
const { getRouteLineString } = require('../../../src/services/routeService');
const { recordGPS } = require('../../../src/services/trackingService');
const simulationService = require('../../../src/services/trackingSimulationService');

describe('Tracking Simulation Service', () => {
    afterEach(() => {
        jest.clearAllTimers();
        jest.clearAllMocks();
    });

    it('schedules GPS recordings every 3 seconds', async () => {
        Ambulance.findByPk.mockResolvedValueOnce({ id: 1, facility_id: 10 });
        Ambulance.findByPk.mockResolvedValueOnce({
            get: jest.fn((field) => (field === 'current_location' ? { type: 'Point', coordinates: [106.1, 10.1] } : null)),
        });
        EmergencyRequest.findByPk.mockResolvedValueOnce({ id: 8 });
        EmergencyRequest.findByPk.mockResolvedValueOnce({
            get: jest.fn((field) => (field === 'patient_location' ? { type: 'Point', coordinates: [106.2, 10.2] } : null)),
        });
        MedicalFacility.findByPk.mockResolvedValue({
            get: jest.fn((field) => (field === 'location_geom' ? { type: 'Point', coordinates: [106.0, 10.0] } : null)),
        });

        getRouteLineString.mockResolvedValue({
            provider: 'osrm',
            distance_meters: 1200,
            duration_seconds: 300,
            lineString: {
                type: 'LineString',
                coordinates: [
                    [106.0, 10.0],
                    [106.1, 10.1],
                    [106.2, 10.2],
                ],
            },
        });

        const result = await simulationService.startSimulation(1, 8, { intervalMs: 3000 });
        expect(result.total_points).toBe(3);

        await jest.advanceTimersByTimeAsync(3000);
        expect(recordGPS).toHaveBeenCalledWith(1, 10.0, 106.0, 8);

        await jest.advanceTimersByTimeAsync(3000);
        expect(recordGPS).toHaveBeenCalledWith(1, 10.1, 106.1, 8);

        await simulationService.stopSimulation(1);
    });
});