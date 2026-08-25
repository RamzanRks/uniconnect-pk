const asyncHandler = require('../utils/asyncHandler');
const Reaction = require('../models/Reaction');

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