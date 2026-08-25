const asyncHandler = require('../utils/asyncHandler');
const Bookmark = require('../models/Bookmark');

// @desc    Toggle bookmark on a project or question
// @route   POST /api/bookmarks/:type/:id
const toggleBookmark = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const existing = await Bookmark.findOne({ user: req.user._id, targetType: type, targetId: id });
  if (existing) {
    await existing.deleteOne();
    return res.json({ bookmarked: false });
  }
  await Bookmark.create({ user: req.user._id, targetType: type, targetId: id });
  res.json({ bookmarked: true });
});

// @desc    My saved items
// @route   GET /api/bookmarks
const getMyBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('targetId');
  res.json(bookmarks);
});

module.exports = { toggleBookmark, getMyBookmarks };