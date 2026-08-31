const express = require('express');
const chatUpload = require('../middleware/chatUploadMiddleware');
const router = express.Router();
const {
  createProjectPost, getProjectPosts, getFilterOptions, updateProgress, togglePin, getProjectById, addScreenshot, removeScreenshot ,
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
router.post('/:id/screenshots', protect, chatUpload.single('shot'), addScreenshot);
router.post('/:id/screenshots/remove', protect, removeScreenshot);

module.exports = router;