const express = require('express');
const router = express.Router();
const officialsController = require('../controllers/officialsController');

// GET all officials with filters
router.get('/', officialsController.getAllOfficials);

// GET single official by ID
router.get('/:id', officialsController.getOfficialById);

// POST create new official
router.post('/', officialsController.createOfficial);

// PUT update official rating
router.put('/:id/rating', officialsController.updateRating);

module.exports = router;
