jest.mock('../../../src/models', () => ({
    AmbulanceTracking: {
        create: jest.fn(),
    },
    Ambulance: {
        findByPk: jest.fn(),
    },
    EmergencyRequest: {},
}));

jest.mock('../../../src/utils/geoHelpers', () => ({
    makePoint: jest.fn((lat, lng) => ({ lat, lng })),
    selectGeoJSON: jest.fn(),
}));

jest.mock('../../../src/utils/coordinateUtils', () => ({
    parseCoordinatePair: jest.fn((lat, lng) => ({ latNum: Number(lat), lngNum: Number(lng) })),
}));

jest.mock('../../../src/config/socket', () => ({
    emitTrackingUpdate: jest.fn(),
}));

const { AmbulanceTracking, Ambulance } = require('../../../src/models');
const { emitTrackingUpdate } = require('../../../src/config/socket');
const trackingService = require('../../../src/services/trackingService');

describe('Tracking Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('records GPS and broadcasts the update', async () => {
        const save = jest.fn();

        Ambulance.findByPk.mockResolvedValue({ id: 7, facility_id: 4, save, current_location: null });
        AmbulanceTracking.create.mockResolvedValue({ recorded_at: new Date('2026-04-18T00:00:00.000Z') });

        const result = await trackingService.recordGPS(7, 10.5, 106.7, 99);

        expect(result).toEqual(expect.objectContaining({ recorded_at: expect.any(Date) }));
        expect(emitTrackingUpdate).toHaveBeenCalledWith(expect.objectContaining({
            ambulance_id: 7,
            emergency_request_id: 99,
            latitude: 10.5,
            longitude: 106.7,
        }));
        expect(AmbulanceTracking.create).toHaveBeenCalledTimes(1);
        expect(save).toHaveBeenCalledTimes(1);
    });
});