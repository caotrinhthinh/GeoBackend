const express = require('express');
const trackingController = require('../controllers/trackingController');
const verifyJWT = require('../middleware/verifyJWT');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

// Chỉ truy cập bởi Admin/SuperAdmin
router.use(verifyJWT, checkRole(1, 2));

router.post('/', trackingController.recordGPS);
router.get('/:ambulanceId/history', trackingController.getHistory);

module.exports = router;
