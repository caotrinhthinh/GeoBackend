const express = require('express');
const facilityController = require('../controllers/facilityController');
const verifyJWT = require('../middleware/verifyJWT');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

// Public routes
router.get('/', facilityController.getAllFacilities);

// Protected routes
router.use(verifyJWT);

router.get('/nearby', facilityController.getNearbyFacilities);

// Admin / SuperAdmin only
router.use(checkRole(1));

router.post('/', facilityController.createFacility);
router.route('/:id')
  .put(facilityController.updateFacility)
  .delete(facilityController.deleteFacility);

module.exports = router;
