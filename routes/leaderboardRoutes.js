const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getLeaderboard, getMyRank } = require('../controllers/leaderboardController');

router.get('/', getLeaderboard);
router.get('/me', protect, getMyRank);

module.exports = router;
