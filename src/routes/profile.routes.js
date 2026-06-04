const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const profileController = require('../controllers/profileController');

const router = express.Router();

router.use(verifyJWT);
router.get('/me', profileController.getMyProfile);
router.put('/me', profileController.upsertMyProfile);

module.exports = router;
