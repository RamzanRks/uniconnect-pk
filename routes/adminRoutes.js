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
  getStats,
  getList,
  getNameChanges,
  approveNameChange,
  rejectNameChange,
} = require('../controllers/adminController');

// Moderation
router.get('/reports', protect, adminOnly, getPendingReports);
router.delete('/projects/:id', protect, adminOnly, deletePost);
router.put('/users/:id/ban', protect, adminOnly, banUser);

// Verifications
router.get('/verifications', protect, adminOnly, getPendingVerifications);
router.put('/verifications/:id/approve', protect, adminOnly, approveVerification);
router.put('/verifications/:id/reject', protect, adminOnly, rejectVerification);

// Analytics & drill-down lists
router.get('/stats', protect, adminOnly, getStats);
router.get('/list/:type', protect, adminOnly, getList);

// Name-change approvals
router.get('/name-changes', protect, adminOnly, getNameChanges);
router.put('/name-changes/:id/approve', protect, adminOnly, approveNameChange);
router.put('/name-changes/:id/reject', protect, adminOnly, rejectNameChange);

module.exports = router;