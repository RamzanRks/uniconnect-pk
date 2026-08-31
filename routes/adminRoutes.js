const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getPendingReports, deletePost, banUser, getPendingVerifications, approveVerification, rejectVerification,
  getStats, getList, getNameChanges, approveNameChange, rejectNameChange,
  addStrike, removeStrike, unbanUser, warnUser ,dismissReport
} = require('../controllers/adminController');

router.get('/reports', protect, adminOnly, getPendingReports);
router.put('/reports/:id/dismiss', protect, adminOnly, dismissReport);
router.delete('/projects/:id', protect, adminOnly, deletePost);
router.put('/users/:id/ban', protect, adminOnly, banUser);
router.put('/users/:id/strike', protect, adminOnly, addStrike);
router.put('/users/:id/unstrike', protect, adminOnly, removeStrike);
router.put('/users/:id/unban', protect, adminOnly, unbanUser);
router.post('/users/:id/warn', protect, adminOnly, warnUser);

router.get('/verifications', protect, adminOnly, getPendingVerifications);
router.put('/verifications/:id/approve', protect, adminOnly, approveVerification);
router.put('/verifications/:id/reject', protect, adminOnly, rejectVerification);

router.get('/stats', protect, adminOnly, getStats);
router.get('/list/:type', protect, adminOnly, getList);

router.get('/name-changes', protect, adminOnly, getNameChanges);
router.put('/name-changes/:id/approve', protect, adminOnly, approveNameChange);
router.put('/name-changes/:id/reject', protect, adminOnly, rejectNameChange);

module.exports = router;