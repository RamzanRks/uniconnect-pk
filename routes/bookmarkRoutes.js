const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { toggleBookmark, getMyBookmarks } = require('../controllers/bookmarkController');

router.get('/', protect, getMyBookmarks);
router.post('/:type/:id', protect, toggleBookmark);

module.exports = router;