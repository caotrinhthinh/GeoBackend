const express = require('express');
const ambulanceController = require('../controllers/ambulanceController');
const verifyJWT = require('../middleware/verifyJWT');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

// Chỉ những người có role 1 (SuperAdmin) và 2 (Admin Trực ban) mới được quản lý xe
router.use(verifyJWT, checkRole(1, 2));

/**
 * @swagger
 * tags:
 *   name: Ambulances
 *   description: Quản lý và điều phối xe cứu thương
 */

/**
 * @swagger
 * /api/ambulances:
 *   get:
 *     summary: Lấy danh sách xe cứu thương
 *     tags: [Ambulances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: facility_id
 *         schema:
 *           type: integer
 *         description: SuperAdmin có thể truyền facility_id để lọc; nếu không truyền thì trả về tất cả xe. Admin trực ban luôn lấy theo facility_id trong JWT.
 *     responses:
 *       200:
 *         description: Danh sách xe
 *   post:
 *     summary: Thêm mới xe cứu thương
 *     tags: [Ambulances]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plate_number: { type: string }
 *               facility_id: { type: integer }
 *     responses:
 *       201:
 *         description: Thành công
 */
router.route('/').get(ambulanceController.getAmbulances).post(ambulanceController.createAmbulance);

/**
 * @swagger
 * /api/ambulances/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái xe cứu thương
 *     tags: [Ambulances]
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
 *               status: { type: string, enum: [available, dispatched, maintenance] }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch('/:id/status', ambulanceController.updateStatus);

/**
 * @swagger
 * /api/ambulances/{id}/location:
 *   patch:
 *     summary: Cập nhật vị trí tức thời của xe
 *     tags: [Ambulances]
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
 *               lat: { type: number }
 *               lng: { type: number }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch('/:id/location', ambulanceController.updateLocation);

module.exports = router;
