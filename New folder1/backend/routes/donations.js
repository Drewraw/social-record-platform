const express = require('express');
const router = express.Router();
const donationsController = require('../controllers/donationsController');

/**
 * @route   GET /api/donations/politician/:id
 * @desc    Get all donations for a specific politician with yearly breakdown
 * @access  Public
 */
router.get('/politician/:id', donationsController.getPoliticianDonations);

/**
 * @route   GET /api/donations/stats
 * @desc    Get overall donation statistics
 * @access  Public
 */
router.get('/stats', donationsController.getDonationsStats);

/**
 * @route   POST /api/donations
 * @desc    Add a new donation record
 * @access  Public (should be protected in production)
 */
router.post('/', donationsController.addDonation);

/**
 * @route   GET /api/donations/search
 * @desc    Search donations by donor name
 * @access  Public
 */
router.get('/search', donationsController.searchDonations);

module.exports = router;
