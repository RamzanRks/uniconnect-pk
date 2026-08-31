const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCoach, generateHeadlines, rewriteBio, askCoach } = require('../controllers/aiController');

router.get('/coach', protect, getCoach);
router.post('/headlines', protect, generateHeadlines);
router.post('/rewrite-bio', protect, rewriteBio);
router.post('/ask', protect, askCoach);

module.exports = router;