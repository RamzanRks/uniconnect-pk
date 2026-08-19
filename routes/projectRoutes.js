const express = require('express');
const router = express.Router();
const {
  createProjectPost,
  getProjectPosts,
  getFilterOptions,
} = require('../controllers/projectController');
const { reportProjectPost } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/filters', getFilterOptions);

router.route('/')
  .post(protect, createProjectPost)
  .get(getProjectPosts);

router.post('/:id/report', protect, reportProjectPost);

module.exports = router;