const express = require('express');
const emergencyController = require('../controllers/emergencyController');
const verifyJWT = require('../middleware/verifyJWT');
const checkRole = require('../middleware/checkRole');
const { sosLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(verifyJWT);

/**
 * @swagger
 * tags:
 *   name: Emergency
 *   description: Xử lý Request Cấp Cứu (SOS)
 */

/**
 * @swagger
 * /api/emergency:
 *   post:
 *     summary: Tạo Request Cấp Cứu rà quét tự động bệnh viện gần nhất
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lat: { type: number, description: "Vĩ độ nạn nhân" }
 *               lng: { type: number, description: "Kinh độ nạn nhân" }
 *               notes: { type: string, description: "Mô tả triệu chứng" }
 *     responses:
 *       201:
 *         description: Thành công. Trả về thông tin ca cấp cứu vừa tạo
 *   get:
 *     summary: Lấy danh sách ca cấp cứu
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     description: Trực ban chỉ thấy danh sách ca cấp cứu của bệnh viện mình.
 *     responses:
 *       200:
 *         description: Danh sách
 */
router.post('/', sosLimiter, emergencyController.createSOS);
router.get('/', checkRole(1, 2), emergencyController.getRequests);

/**
 * @swagger
 * /api/emergency/{id}/assign:
 *   patch:
 *     summary: Điều động xe cứu thương cho ca cấp cứu
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ambulance_id: { type: integer }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.patch('/:id/assign', checkRole(1, 2), emergencyController.assignAmbulance);

/**
 * @swagger
 * /api/emergency/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái xử lý ca cấp cứu
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [pending, assigned, in_progress, completed, cancelled] }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.patch('/:id/status', checkRole(1, 2), emergencyController.updateStatus);

module.exports = router;
