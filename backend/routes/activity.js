const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

// GET activity for an official
router.get('/official/:officialId', activityController.getActivityByOfficial);

// GET all recent activity
router.get('/', activityController.getAllRecentActivity);

// POST create new activity
router.post('/', activityController.createActivity);

module.exports = router;
