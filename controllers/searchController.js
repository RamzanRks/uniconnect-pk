const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const ProjectPost = require('../models/ProjectPost');
const Question = require('../models/Question');

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// @desc    Global search with category counts
// @route   GET /api/search?q=...
const globalSearch = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ counts: { users: 0, projects: 0, questions: 0 }, users: [], projects: [], questions: [] });

  const regex = new RegExp(escapeRegex(q), 'i');

  const [users, projects, questions] = await Promise.all([
    User.find({
      $or: [
        { firstName: regex }, { lastName: regex }, { username: regex }, { university: regex }
      ],
      isBanned: false
    }).select('firstName lastName username avatarUrl university points').limit(20),
    
    ProjectPost.find({
      $or: [{ title: regex }, { description: regex }],
      status: { $ne: 'hidden' }
    }).select('title requiredSkills creator progress').populate('creator', 'firstName lastName avatarUrl').limit(20),
    
    Question.find({
      $or: [{ title: regex }, { content: regex }],
      status: 'open'
    }).select('title author').populate('author', 'firstName lastName avatarUrl').limit(20),
  ]);

  res.json({
    counts: { users: users.length, projects: projects.length, questions: questions.length },
    users, projects, questions
  });
});

module.exports = { globalSearch };