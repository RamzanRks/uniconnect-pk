const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPolls, createPoll, votePoll, closePoll, deletePoll } = require('../controllers/pollController');

router.get('/project/:id', getPolls);
router.post('/project/:id', protect, createPoll);
router.post('/:id/vote', protect, votePoll);
router.post('/:id/close', protect, closePoll);
router.delete('/:id', protect, deletePoll);

module.exports = router;