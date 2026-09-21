const asyncHandler = require('../utils/asyncHandler');
const Reaction = require('../models/Reaction');
const ProjectPost = require('../models/ProjectPost');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { notifyUser } = require('../utils/socket');

// @desc    Toggle an emoji reaction on post/question/answer
// @route   POST /api/reactions/:type/:id
const toggleReaction = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { emoji } = req.body;
  const existing = await Reaction.findOne({ targetType: type, targetId: id, user: req.user._id, emoji });

  if (existing) {
    await existing.deleteOne();
  } else {
    await Reaction.create({ targetType: type, targetId: id, user: req.user._id, emoji });

    // Notify the content owner
    let ownerId = null;
    let link = '/';
    let contentLabel = 'your content';

    if (type === 'ProjectPost') {
      const post = await ProjectPost.findById(id).select('creator title');
      if (post) {
        ownerId = post.creator;
        link = `/project/${post._id}`;
        contentLabel = `your project "${post.title}"`;
      }
    } else if (type === 'Question') {
      const q = await Question.findById(id).select('author title');
      if (q) {
        ownerId = q.author;
        link = '/qa';
        contentLabel = `your question "${q.title}"`;
      }
    } else if (type === 'Answer') {
      const a = await Answer.findById(id).select('author');
      if (a) {
        ownerId = a.author;
        link = '/qa';
        contentLabel = 'your answer';
      }
    }

    if (ownerId && ownerId.toString() !== req.user._id.toString()) {
      await notifyUser(ownerId, 'reaction', `${req.user.firstName} ${req.user.lastName} reacted ${emoji} to ${contentLabel}.`, link);
    }
  }

  const all = await Reaction.find({ targetType: type, targetId: id });
  const counts = {};
  all.forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
  const mine = all.filter((r) => r.user.toString() === req.user._id.toString()).map((r) => r.emoji);
  res.json({ counts, mine });
});

// @desc    Get reaction counts for a target
// @route   GET /api/reactions/:type/:id
const getReactions = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const all = await Reaction.find({ targetType: type, targetId: id });
  const counts = {};
  all.forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
  const mine = req.user
    ? all.filter((r) => r.user.toString() === req.user._id.toString()).map((r) => r.emoji)
    : [];
  res.json({ counts, mine });
});

module.exports = { toggleReaction, getReactions };