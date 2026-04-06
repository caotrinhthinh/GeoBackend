const express = require('express');
const emergencyController = require('../controllers/emergencyController');
const verifyJWT = require('../middleware/verifyJWT');
const checkRole = require('../middleware/checkRole');
const { sosLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(verifyJWT);

// Bất kỳ user nào đã login đều có thể gửi SOS
router.post('/', sosLimiter, emergencyController.createSOS);

// Lấy danh sách SOS (Admin & SuperAdmin)
router.get('/', checkRole(1, 2), emergencyController.getRequests);

// Điều động xe và đổi trạng thái (Admin & SuperAdmin)
router.patch('/:id/assign', checkRole(1, 2), emergencyController.assignAmbulance);
router.patch('/:id/status', checkRole(1, 2), emergencyController.updateStatus);

module.exports = router;
