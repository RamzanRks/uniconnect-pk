const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  openConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} = require('../controllers/messageController');

router.post('/open', protect, openConversation);
router.get('/conversations', protect, getMyConversations);
router.get('/conversation/:id', protect, getMessages);
router.post('/conversation/:id', protect, sendMessage);

module.exports = router;