const express = require('express');
const emergencyController = require('../controllers/emergencyController');
const verifyJWT = require('../middleware/verifyJWT');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

/**
 * Dispatcher dashboard data (TC09-TC11)
 * GET /api/emergencies
 */
router.get('/', verifyJWT, checkRole(1, 2), emergencyController.getEmergenciesAdmin);

module.exports = router;

