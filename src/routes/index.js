const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const facilityRoutes = require('./facility.routes');
const ambulanceRoutes = require('./ambulance.routes');
const emergencyRoutes = require('./emergency.routes');
const emergenciesRoutes = require('./emergencies.routes');
const trackingRoutes = require('./tracking.routes');
const profileRoutes = require('./profile.routes');
const verifyJWT = require('../middleware/verifyJWT');
const checkRole = require('../middleware/checkRole');
const emergencyController = require('../controllers/emergencyController');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/facilities', facilityRoutes);
router.use('/ambulances', ambulanceRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/emergencies', emergenciesRoutes);
router.use('/tracking', trackingRoutes);
router.use('/profile', profileRoutes);
router.post('/dispatch', verifyJWT, checkRole(2), emergencyController.dispatchAmbulance);

module.exports = router;
