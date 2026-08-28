const asyncHandler = require('../utils/asyncHandler');
const Announcement = require('../models/Announcement');
const { notifyUser } = require('../utils/socket');
const User = require('../models/User');

// @desc    Admin creates an announcement
// @route   POST /api/announcements
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, body } = req.body;
  const ann = await Announcement.create({ title, body, author: req.user._id });
  
  // Notify everyone (we don't spam sockets to all, but save it for the feed)
  res.status(201).json(ann);
});

// @desc    Get recent announcements
// @route   GET /api/announcements
const getAnnouncements = asyncHandler(async (req, res) => {
  const anns = await Announcement.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('author', 'firstName lastName avatarUrl role');
  res.json(anns);
});

// @desc    Admin deletes announcement
// @route   DELETE /api/announcements/:id
const deleteAnnouncement = asyncHandler(async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ message: 'Announcement deleted.' });
});

module.exports = { createAnnouncement, getAnnouncements, deleteAnnouncement };