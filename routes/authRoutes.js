const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const chatUpload = require('../middleware/chatUploadMiddleware');
const {
  registerUser,
  loginUser,
  verifyTwoFA,
  getUserProfile,
  updateProfile,
  requestNameChange,
  setAvatar,
  removeAvatar,
  requestVerification,
  exportMyData,
  verifyEmail,
  resendCode,
  googleLogin,
  changePassword,
  forgotPassword,
  resetPassword,
  checkCode,
  completeProfile,
  setBanner,
  getSessions,
  logoutOthers,
  logoutSession,
  setTwoFA,
  updateNotifPrefs,
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-2fa', verifyTwoFA);
router.post('/google', googleLogin);
router.post('/complete-profile', protect, completeProfile);

router.get('/me', protect, getUserProfile);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);

router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/check-code', checkCode);
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendCode);

router.post('/avatar', protect, chatUpload.single('avatar'), setAvatar);
router.delete('/avatar', protect, removeAvatar);
router.post('/banner', protect, chatUpload.single('banner'), setBanner);
router.post('/verify', protect, chatUpload.single('idCard'), requestVerification);
router.post('/name-change', protect, requestNameChange);
router.get('/export', protect, exportMyData);

router.get('/sessions', protect, getSessions);
router.post('/logout-others', protect, logoutOthers);
router.post('/logout-session', protect, logoutSession);
router.put('/2fa', protect, setTwoFA);
router.put('/notif-prefs', protect, updateNotifPrefs);

module.exports = router;