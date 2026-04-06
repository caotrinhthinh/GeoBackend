const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const facilityRoutes = require('./facility.routes');
const ambulanceRoutes = require('./ambulance.routes');
const emergencyRoutes = require('./emergency.routes');
// const trackingRoutes = require('./tracking.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/facilities', facilityRoutes);
router.use('/ambulances', ambulanceRoutes);
router.use('/emergency', emergencyRoutes);
// router.use('/tracking', trackingRoutes);

module.exports = router;
