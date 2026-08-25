const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const avatarUpload = require('../middleware/avatarUploadMiddleware');
const {
  registerUser, loginUser, getUserProfile, updateProfile,
  requestNameChange, setAvatar, removeAvatar, requestVerification, exportMyData,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.post('/name-change', protect, requestNameChange);
router.post('/avatar', protect, avatarUpload.single('avatar'), setAvatar);
router.delete('/avatar', protect, removeAvatar);
router.post('/verify', protect, upload.single('idCard'), requestVerification);
router.get('/export', protect, exportMyData);

module.exports = router;