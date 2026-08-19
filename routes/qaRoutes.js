const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getQuestions,
  createQuestion,
  getQuestionById,
  createAnswer,
  reportQuestion,
  acceptAnswer,
} = require('../controllers/qaController');

router.route('/')
  .get(getQuestions)
  .post(protect, createQuestion);

router.get('/:id', getQuestionById);
router.post('/:id/report', protect, reportQuestion);
router.post('/:id/answers', protect, createAnswer);
router.put('/answers/:id/accept', protect, acceptAnswer);

module.exports = router;