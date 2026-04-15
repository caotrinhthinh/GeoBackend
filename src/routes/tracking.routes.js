const express = require("express");
const trackingController = require("../controllers/trackingController");
const verifyJWT = require("../middleware/verifyJWT");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

// Chỉ truy cập bởi Admin/SuperAdmin
router.use(verifyJWT, checkRole(1, 2));

/**
 * @swagger
 * tags:
 *   name: Tracking
 *   description: Lưu và truy vết GPS xe cứu thương
 */

/**
 * @swagger
 * /api/tracking:
 *   post:
 *     summary: Ghi log vị trí của xe (Từ thiết bị trên xe đẩy lên)
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ambulance_id: { type: integer }
 *               lat: { type: number }
 *               lng: { type: number }
 *               emergency_request_id: { type: integer }
 *     responses:
 *       201:
 *         description: Thành công
 */
router.post("/", trackingController.recordGPS);

/**
 * @swagger
 * /api/tracking/simulator/start:
 *   post:
 *     summary: Start an ambulance GPS simulator (3-5 seconds interval)
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emergency_request_id]
 *             properties:
 *               emergency_request_id: { type: integer }
 *               interval_seconds: { type: number, minimum: 3, maximum: 5 }
 *     responses:
 *       201:
 *         description: Simulation started
 */
router.post("/simulator/start", trackingController.startSimulation);

/**
 * @swagger
 * /api/tracking/simulator/stop:
 *   post:
 *     summary: Stop an active GPS simulator
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [simulation_id]
 *             properties:
 *               simulation_id: { type: string }
 *     responses:
 *       200:
 *         description: Simulation stopped
 */
router.post("/simulator/stop", trackingController.stopSimulation);

/**
 * @swagger
 * /api/tracking/simulator/{simulationId}:
 *   get:
 *     summary: Get simulator status
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: simulationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Simulation status
 */
router.get("/simulator/:simulationId", trackingController.getSimulationStatus);

/**
 * @swagger
 * /api/tracking/{ambulanceId}/history:
 *   get:
 *     summary: Lấy chuỗi vết GPS của xe
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ambulanceId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng max records (default 50)
 *     responses:
 *       200:
 *         description: Trả về mảng Lịch sử di chuyển (LIFO)
 */
router.get("/:ambulanceId/history", trackingController.getHistory);

module.exports = router;
