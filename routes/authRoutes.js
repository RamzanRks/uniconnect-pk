const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateProfile,
  requestVerification,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.post('/verify', protect, upload.single('idCard'), requestVerification);

module.exports = router;