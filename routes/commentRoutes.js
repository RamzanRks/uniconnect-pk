const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getComments, createComment, voteComment, reportComment, deleteComment } = require('../controllers/commentController');

router.get('/project/:id', getComments);
router.post('/project/:id', protect, createComment);
router.post('/:id/vote', protect, voteComment);
router.post('/:id/report', protect, reportComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;