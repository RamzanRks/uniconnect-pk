const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const ProjectPost = require('../models/ProjectPost');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Application = require('../models/Application');

const getMyDashboard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const [projects, questions, answers, applications, followersCount, allUsers] = await Promise.all([
    ProjectPost.countDocuments({ creator: user._id }),
    Question.countDocuments({ author: user._id }),
    Answer.countDocuments({ author: user._id }),
    Application.countDocuments({ applicant: user._id }),
    User.countDocuments({ followers: user._id }),
    User.find({ isBanned: false }).select('_id points').sort({ points: -1, createdAt: 1 }),
  ]);

  const idx = allUsers.findIndex((u) => u._id.toString() === user._id.toString());

  res.json({
    projects,
    questions,
    answers,
    applications,
    followersCount,
    points: user.points || 0,
    rank: idx + 1,
  });
});

module.exports = { getMyDashboard };