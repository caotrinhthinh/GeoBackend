const express = require('express');
const ambulanceController = require('../controllers/ambulanceController');
const verifyJWT = require('../middleware/verifyJWT');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

// Chỉ những người có role 1 (SuperAdmin) và 2 (Admin Trực ban) mới được quản lý xe
router.use(verifyJWT, checkRole(1, 2));

router.route('/')
  .get(ambulanceController.getAmbulances)
  .post(ambulanceController.createAmbulance);

router.patch('/:id/status', ambulanceController.updateStatus);
router.patch('/:id/location', ambulanceController.updateLocation);

module.exports = router;
