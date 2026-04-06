jest.mock('../../../src/models', () => {
  return {
    sequelize: {
      query: jest.fn(),
      QueryTypes: { SELECT: 'SELECT' }
    },
    EmergencyRequest: {
      create: jest.fn(),
    }
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
      'Không tìm thấy bệnh viện nào'
    );
  });

  it('createSOS should assign nearest hospital if found', async () => {
    const mockHospitals = [{ id: 5, distance_meters: 1000 }];
    sequelize.query.mockResolvedValue(mockHospitals);
    
    EmergencyRequest.create.mockResolvedValue({
      id: 99,
      assigned_facility_id: 5,
      status: 'pending'
    });

    geoHelpers.makePoint.mockReturnValue('MOCK_POINT');

    const result = await emergencyService.createSOS(2, 10.7, 106.6, 'Emergency!');
    
    expect(sequelize.query).toHaveBeenCalledTimes(1);
    expect(EmergencyRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      requester_id: 2,
      assigned_facility_id: 5,
      status: 'pending'
    }));
    expect(result.assigned_facility_id).toBe(5);
  });
});
