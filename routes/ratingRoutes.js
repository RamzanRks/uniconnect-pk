const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createRating, getUserRatings } = require('../controllers/ratingController');

router.post('/', protect, createRating);
router.get('/user/:id', getUserRatings);

module.exports = router;