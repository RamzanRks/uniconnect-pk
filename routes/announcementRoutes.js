const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { createAnnouncement, getAnnouncements, deleteAnnouncement } = require('../controllers/announcementController');

router.post('/', protect, adminOnly, createAnnouncement);
router.delete('/:id', protect, adminOnly, deleteAnnouncement);
router.get('/', getAnnouncements);

module.exports = router;