const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getPendingReports,
  deletePost,
  banUser,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
} = require('../controllers/adminController');

router.get('/reports', protect, adminOnly, getPendingReports);
router.delete('/projects/:id', protect, adminOnly, deletePost);
router.put('/users/:id/ban', protect, adminOnly, banUser);

router.get('/verifications', protect, adminOnly, getPendingVerifications);
router.put('/verifications/:id/approve', protect, adminOnly, approveVerification);
router.put('/verifications/:id/reject', protect, adminOnly, rejectVerification);

module.exports = router;