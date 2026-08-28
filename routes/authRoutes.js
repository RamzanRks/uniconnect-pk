const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const avatarUpload = require('../middleware/avatarUploadMiddleware');
const {
  registerUser, loginUser, getUserProfile, updateProfile,
  requestNameChange, setAvatar, removeAvatar, requestVerification, exportMyData,
  verifyEmail, resendCode, googleLogin, changePassword, forgotPassword, resetPassword,
  checkCode, completeProfile,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendCode);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/check-code', checkCode);
router.put('/change-password', protect, changePassword);
router.post('/complete-profile', protect, completeProfile);

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.post('/name-change', protect, requestNameChange);
router.post('/avatar', protect, avatarUpload.single('avatar'), setAvatar);
router.delete('/avatar', protect, removeAvatar);
router.post('/verify', protect, upload.single('idCard'), requestVerification);
router.get('/export', protect, exportMyData);

module.exports = router;