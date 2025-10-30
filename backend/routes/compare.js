const express = require('express');
const router = express.Router();
const compareController = require('../controllers/compareController');

// GET comparisons for an official
router.get('/official/:officialId', compareController.getComparisonsByOfficial);

// POST create new comparison
router.post('/', compareController.createComparison);

module.exports = router;
