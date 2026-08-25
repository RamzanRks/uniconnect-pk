const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { toggleReaction, getReactions } = require('../controllers/reactionController');

router.post('/:type/:id', protect, toggleReaction);
router.get('/:type/:id', protect, getReactions);

module.exports = router;