jest.mock('https', () => ({
    get: jest.fn(),
}));

const https = require('https');
const routeService = require('../../../src/services/routeService');

describe('Route Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('falls back to a straight line when OSRM is unavailable', async () => {
        https.get.mockImplementation((url, callback) => {
            const request = {
                on: (eventName, handler) => {
                    if (eventName === 'error') {
                        process.nextTick(() => handler(new Error('network failure')));
                    }

                    return request;
                },
            };

            return request;
        });

        const result = await routeService.getRouteLineString(
            { lat: 10.1, lng: 106.1 },
            { lat: 10.2, lng: 106.2 },
        );

        expect(result.provider).toBe('fallback-straight-line');
        expect(result.lineString.coordinates.length).toBeGreaterThan(2);
        expect(result.lineString.coordinates[0]).toEqual([106.1, 10.1]);
        expect(result.lineString.coordinates[result.lineString.coordinates.length - 1]).toEqual([106.2, 10.2]);
        expect(result.distance_meters).toBeGreaterThan(0);
    });
});