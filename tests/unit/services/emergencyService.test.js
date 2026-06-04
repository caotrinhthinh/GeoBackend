jest.mock('../../../src/models', () => {
    const describeTable = jest.fn(async (tableName) => {
        if (tableName === 'user_profiles') {
            throw new Error('no user_profiles in unit mock');
        }
        // emergency_request: đủ cột để getEmergencyRequestColumns + returningAttributes hoạt động
        return {
            id: {},
            requester_id: {},
            patient_location: {},
            assigned_facility_id: {},
            assigned_ambulance_id: {},
            status: {},
            distance_meters: {},
            route_geometry: {},
            eta_seconds: {},
            done_at: {},
            notes: {},
            created_at: {},
            updated_at: {},
        };
    });

    return {
        sequelize: {
            query: jest.fn(),
            QueryTypes: { SELECT: 'SELECT' },
            getQueryInterface: jest.fn(() => ({ describeTable })),
        },
        EmergencyRequest: {
            create: jest.fn(),
        },
    };
});

const { sequelize, EmergencyRequest } = require('../../../src/models');
const emergencyService = require('../../../src/services/emergencyService');
const AppError = require('../../../src/utils/AppError');
const geoHelpers = require('../../../src/utils/geoHelpers');
jest.mock('../../../src/utils/geoHelpers');

describe('Emergency Service (Logic Chọn Xe/Bệnh Viện)', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('createSOS should throw an error if no hospital found', async () => {
        sequelize.query.mockResolvedValue([]); // No hospitals returned

        await expect(emergencyService.createSOS(1, 10.7, 106.6, 'Help')).rejects.toThrow(
            'Không tìm thấy bệnh viện nào',
        );
    });

    it('createSOS should assign nearest hospital if found', async () => {
        const mockHospitals = [{ id: 5, distance_meters: 1000 }];
        sequelize.query.mockResolvedValue(mockHospitals);

        EmergencyRequest.create.mockResolvedValue({
            id: 99,
            assigned_facility_id: 5,
            status: 'pending',
        });

        geoHelpers.makePoint.mockReturnValue('MOCK_POINT');

        const result = await emergencyService.createSOS(2, 10.7, 106.6, 'Emergency!');

        // createSOS now runs 2 queries: supported-area check + nearest-hospital lookup
        expect(sequelize.query).toHaveBeenCalledTimes(2);
        expect(EmergencyRequest.create).toHaveBeenCalledWith(
            expect.objectContaining({
                requester_id: 2,
                assigned_facility_id: 5,
                status: 'pending',
            }),
            expect.objectContaining({ returning: expect.any(Array) }),
        );
        expect(result.assigned_facility_id).toBe(5);
    });

    it('createSOS should accept zero coordinates', async () => {
        const mockHospitals = [{ id: 7, distance_meters: 250 }];
        sequelize.query.mockResolvedValue(mockHospitals);
        EmergencyRequest.create.mockResolvedValue({ id: 100, assigned_facility_id: 7, status: 'pending' });
        geoHelpers.makePoint.mockReturnValue('MOCK_POINT');

        await expect(emergencyService.createSOS(3, 0, 0, 'Zero coords')).resolves.toEqual(
            expect.objectContaining({ assigned_facility_id: 7 }),
        );

        expect(EmergencyRequest.create).toHaveBeenCalledWith(
            expect.objectContaining({
                requester_id: 3,
                assigned_facility_id: 7,
                status: 'pending',
            }),
            expect.objectContaining({ returning: expect.any(Array) }),
        );
    });
});
