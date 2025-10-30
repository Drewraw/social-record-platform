const express = require('express');
const router = express.Router();
const promisesController = require('../controllers/promisesController');

// GET all promises for an official
router.get('/official/:officialId', promisesController.getPromisesByOfficial);

// GET single promise
router.get('/:id', promisesController.getPromiseById);

// POST create new promise
router.post('/', promisesController.createPromise);

// PUT update promise
router.put('/:id', promisesController.updatePromise);

module.exports = router;
