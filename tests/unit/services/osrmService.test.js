const AppError = require("../../../src/utils/AppError");
const { getOptimalRoute, parseOsrmRoute } = require("../../../src/services/osrmService");

describe("OSRM Service", () => {
    afterEach(() => {
        jest.restoreAllMocks();
        delete global.fetch;
    });

    it("parseOsrmRoute should return LineString payload", () => {
        const payload = {
            code: "Ok",
            routes: [
                {
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [106.7, 10.77],
                            [106.71, 10.78],
                        ],
                    },
                    distance: 1500,
                    duration: 360,
                },
            ],
        };

        const result = parseOsrmRoute(payload);

        expect(result.line_string.type).toBe("LineString");
        expect(result.line_string.coordinates).toHaveLength(2);
        expect(result.distance_meters).toBe(1500);
        expect(result.duration_seconds).toBe(360);
    });

    it("parseOsrmRoute should throw AppError for invalid payload", () => {
        expect(() => parseOsrmRoute({ code: "NoRoute", routes: [] })).toThrow(AppError);
    });

    it("getOptimalRoute should call OSRM and return route", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                code: "Ok",
                routes: [
                    {
                        geometry: {
                            type: "LineString",
                            coordinates: [
                                [106.7, 10.77],
                                [106.71, 10.78],
                            ],
                        },
                        distance: 1500,
                        duration: 360,
                    },
                ],
            }),
        });

        const result = await getOptimalRoute({ lat: 10.77, lng: 106.7 }, { lat: 10.78, lng: 106.71 });

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(result.line_string.type).toBe("LineString");
    });
});
