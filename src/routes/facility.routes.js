const express = require('express');
const facilityController = require('../controllers/facilityController');
const verifyJWT = require('../middleware/verifyJWT');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Facilities
 *   description: Quản lý Bệnh viện & Nhà thuốc
 */

/**
 * @swagger
 * /api/facilities:
 *   get:
 *     summary: Lấy danh sách tất cả cơ sở y tế
 *     tags: [Facilities]
 *     responses:
 *       200:
 *         description: Danh sách cơ sở
 */
router.get('/', facilityController.getAllFacilities);

router.use(verifyJWT);

/**
 * @swagger
 * /api/facilities/nearby:
 *   get:
 *     summary: Tìm cơ sở y tế gần một điểm tọa độ
 *     tags: [Facilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *         description: Bán kính tính bằng mét (mặc định 5000)
 *     responses:
 *       200:
 *         description: Danh sách cơ sở trong bán kính
 */
router.get('/nearby', facilityController.getNearbyFacilities);

/**
 * Danh sách đầy đủ cho SuperAdmin (gồm cơ sở tạm ngưng / soft-delete).
 * Phải khai báo trước router `/:id` để không bị nuốt bởi param.
 */
router.get('/admin-overview', checkRole(1), facilityController.getAllFacilitiesForAdmin);

router.use(checkRole(1));

/**
 * @swagger
 * /api/facilities:
 *   post:
 *     summary: Thêm mới cơ sở y tế (Chỉ SuperAdmin)
 *     tags: [Facilities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               type: { type: string, enum: [hospital, pharmacy] }
 *               lat: { type: number }
 *               lng: { type: number }
 *     responses:
 *       201:
 *         description: Thành công
 */
router.post('/', facilityController.createFacility);

/**
 * @swagger
 * /api/facilities/{id}:
 *   put:
 *     summary: Sửa thông tin cơ sở y tế (Chỉ SuperAdmin)
 *     tags: [Facilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thay đổi thành công
 *   delete:
 *     summary: Xóa (Soft delete) cơ sở y tế (Chỉ SuperAdmin)
 *     tags: [Facilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Xóa thành công
 */
router.route('/:id')
  .put(facilityController.updateFacility)
  .delete(facilityController.deleteFacility);

module.exports = router;
