const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');

// GET comments for an official
router.get('/official/:officialId', forumController.getCommentsByOfficial);

// POST create new comment
router.post('/', forumController.createComment);

// PUT like a comment
router.put('/:id/like', forumController.likeComment);

module.exports = router;
