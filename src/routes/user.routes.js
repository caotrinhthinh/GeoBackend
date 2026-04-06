const express = require('express');
const userController = require('../controllers/userController');
const verifyJWT = require('../middleware/verifyJWT');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

// Tất cả user routes yêu cầu Super Admin (role 1)
router.use(verifyJWT, checkRole(1));

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role_id]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               role_id: { type: integer, enum: [1, 2, 3] }
 *               facility_id: { type: integer }
 *     responses:
 *       201:
 *         description: User created
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách user
 */
router.route('/')
  .post(userController.createUser)
  .get(userController.getUsers);

module.exports = router;
