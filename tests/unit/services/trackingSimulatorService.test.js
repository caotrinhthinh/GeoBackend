jest.mock("../../../src/models", () => ({
    sequelize: {
        query: jest.fn(),
        QueryTypes: { SELECT: "SELECT" },
    },
}));

jest.mock("../../../src/services/osrmService", () => ({
    getOptimalRoute: jest.fn(),
}));

jest.mock("../../../src/services/trackingService", () => ({
    recordGPS: jest.fn(),
}));

const { buildPointTimeline } = require("../../../src/services/trackingSimulatorService");

describe("Tracking Simulator Service", () => {
    it("buildPointTimeline should keep all points when list is short", () => {
        const points = [
            [106.7, 10.77],
            [106.71, 10.78],
            [106.72, 10.79],
        ];

        const result = buildPointTimeline(points);

        expect(result).toEqual(points);
    });

    it("buildPointTimeline should downsample and keep last point", () => {
        const points = Array.from({ length: 200 }, (_, index) => [106.7 + index * 0.0001, 10.7 + index * 0.0001]);

        const result = buildPointTimeline(points);

        expect(result.length).toBeLessThanOrEqual(120);
        expect(result[result.length - 1]).toEqual(points[points.length - 1]);
    });
});
