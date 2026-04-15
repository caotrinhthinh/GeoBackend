// Mock cho models
jest.mock('../../../src/models', () => {
    return {
        sequelize: {
            query: jest.fn(),
            QueryTypes: { SELECT: 'SELECT' },
        },
        MedicalFacility: {
            findAll: jest.fn(),
        },
    };
});

const { sequelize, MedicalFacility } = require('../../../src/models');
const facilityService = require('../../../src/services/facilityService');
const AppError = require('../../../src/utils/AppError');

describe('Facility Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('getNearbyFacilities should throw error if lat/lng missing', async () => {
        await expect(facilityService.getNearbyFacilities(null, null)).rejects.toThrow(AppError);
    });

    it('getNearbyFacilities should return facilities near location', async () => {
        const mockFacilities = [{ id: 1, distance_meters: 500, name: 'BV A' }];
        sequelize.query.mockResolvedValue(mockFacilities);

        const result = await facilityService.getNearbyFacilities(10.7, 106.6, 1000);
        expect(result).toEqual(mockFacilities);
        expect(sequelize.query).toHaveBeenCalledTimes(1);
    });

    it('getNearbyFacilities should accept zero coordinates', async () => {
        sequelize.query.mockResolvedValue([]);

        await facilityService.getNearbyFacilities(0, 106.6, 1000);

        expect(sequelize.query).toHaveBeenCalledTimes(1);
        expect(sequelize.query.mock.calls[0][1]).toEqual(
            expect.objectContaining({
                replacements: expect.objectContaining({ lat: 0, lng: 106.6, radius: 1000 }),
            }),
        );
    });
});
