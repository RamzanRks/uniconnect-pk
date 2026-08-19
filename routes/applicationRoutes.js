const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  applyToProject,
  getProjectApplications,
  updateApplicationStatus,
} = require('../controllers/applicationController');

router.route('/project/:projectId')
  .post(protect, applyToProject)
  .get(protect, getProjectApplications);

router.put('/:id/status', protect, updateApplicationStatus);

module.exports = router;