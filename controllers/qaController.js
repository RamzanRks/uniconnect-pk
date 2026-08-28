const asyncHandler = require('../utils/asyncHandler');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Report = require('../models/Report');
const { notifyUser } = require('../utils/socket');

// @desc    Get all open questions
// @route   GET /api/qa
const getQuestions = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const count = await Question.countDocuments({ status: 'open' });

  const questions = await Question.find({ status: 'open' })
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate('author', 'firstName lastName university');

  res.json({ questions, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Create a new question
// @route   POST /api/qa
const createQuestion = asyncHandler(async (req, res) => {
  const { title, content, tags } = req.body;
  const question = await Question.create({
    title,
    content,
    tags: (tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    author: req.user._id,
  });

    // Award points for asking a question
  const { awardPoints } = require('../utils/points');
  await awardPoints(req.user._id, 5);

  res.status(201).json(question);
});

// @desc    Get single question and its answers
// @route   GET /api/qa/:id
const getQuestionById = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id).populate('author', 'firstName lastName university');
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  const answers = await Answer.find({ question: req.params.id })
    .sort({ isAccepted: -1, createdAt: -1 })
    .populate('author', 'firstName lastName university');

  res.json({ question, answers });
});

// @desc    Post an answer
// @route   POST /api/qa/:id/answers
const createAnswer = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

   const answer = await Answer.create({
    question: question._id,
    author: req.user._id,
    content,
  });

  // Award points for answering
  const { awardPoints } = require('../utils/points');
  await awardPoints(req.user._id, 5);
  
    if (question.author.toString() !== req.user._id.toString()) {
    await notifyUser(question.author, 'answer', `${req.user.firstName} ${req.user.lastName} answered your question "${question.title}"`, `/qa/${question._id}`);
  }
  res.status(201).json(answer);
});

// @desc    Report a question (Anti-Troll)
// @route   POST /api/qa/:id/report
const reportQuestion = asyncHandler(async (req, res) => {
  const { reason, details } = req.body;
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }
  if (question.reportedBy.includes(req.user._id)) {
    res.status(400);
    throw new Error('You have already reported this question.');
  }

  question.reportCount += 1;
  question.reportedBy.push(req.user._id);
  await question.save(); // Auto-hides at 3 reports via model hook

  await Report.create({
    targetType: 'QA_Post',
    targetId: question._id,
    reporter: req.user._id,
    reason,
    details,
    status: 'pending',
  });

  res.status(200).json({ message: 'Report submitted. Our moderation team will review it shortly.' });
});

// @desc    Mark an answer as the accepted solution (question author only)
// @route   PUT /api/qa/answers/:id/accept
const acceptAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id).populate('question');
  if (!answer) {
    res.status(404);
    throw new Error('Answer not found');
  }

  // SECURITY: Only the question author can accept an answer
  if (answer.question.author.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the question author can accept an answer.');
  }

  // Un-accept any other answer, then accept this one
  await Answer.updateMany({ question: answer.question._id }, { isAccepted: false });
  answer.isAccepted = true;
  await answer.save();

  await Question.findByIdAndUpdate(answer.question._id, { isResolved: true });
  
  // Award 15 points to the answer author
  const { awardPoints } = require('../utils/points');
  await awardPoints(answer.author, 15);

  res.json({ message: 'Answer marked as the accepted solution.' });
});

module.exports = { getQuestions, createQuestion, getQuestionById, createAnswer, reportQuestion, acceptAnswer };