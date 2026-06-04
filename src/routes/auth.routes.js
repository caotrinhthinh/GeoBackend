const express = require('express');
const authController = require('../controllers/authController');
const verifyJWT = require('../middleware/verifyJWT');

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "admin@geobackend.local" }
 *               password: { type: string, example: "admin123" }
 *     responses:
 *       200:
 *         description: Trả về access token và thông tin user
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Sai email hoặc mật khẩu
 */
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/google', authController.googleLogin);
router.post('/refresh-token', authController.refreshToken);
router.post('/link-guest-account', verifyJWT, authController.linkGuestAccount);

module.exports = router;
