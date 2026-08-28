const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const chatUpload = require('../middleware/chatUploadMiddleware');
const {
  openConversation, getMyConversations, getConvoMeta, acceptRequest, getMessages,
  sendMessage, deleteMessage, forwardMessage, updateSettings, leaveGroup, updateGroupInfo,
  createGroup, addMembers, removeMember, makeAdmin,
} = require('../controllers/messageController');

router.post('/open', protect, openConversation);
router.post('/group', protect, createGroup);
router.post('/forward', protect, forwardMessage);
router.get('/conversations', protect, getMyConversations);
router.put('/conversation/:id/accept', protect, acceptRequest);
router.get('/conversation/:id/meta', protect, getConvoMeta);
router.get('/conversation/:id', protect, getMessages);
router.post('/conversation/:id', protect, chatUpload.single('image'), sendMessage);
router.post('/message/:id/delete', protect, deleteMessage);
router.post('/conversation/:id/settings', protect, updateSettings);
router.post('/conversation/:id/leave', protect, leaveGroup);
router.post('/conversation/:id/group-info', protect, chatUpload.single('photo'), updateGroupInfo);
router.post('/conversation/:id/add-members', protect, addMembers);
router.post('/conversation/:id/remove-member', protect, removeMember);
router.post('/conversation/:id/make-admin', protect, makeAdmin);

module.exports = router;