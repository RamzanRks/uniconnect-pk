const express = require('express');
const router = express.Router();
const {
  createProjectPost, getProjectPosts, getFilterOptions, updateProgress, togglePin, getProjectById,
} = require('../controllers/projectController');
const { reportProjectPost } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/filters', getFilterOptions);

router.route('/')
  .post(protect, createProjectPost)
  .get(getProjectPosts);

router.put('/:id/progress', protect, updateProgress);
router.post('/:id/pin', protect, togglePin);
router.post('/:id/report', protect, reportProjectPost);

router.get('/:id', getProjectById);

module.exports = router;