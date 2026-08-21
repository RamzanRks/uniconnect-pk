const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');

const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);
  res.json(notifications);
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read.' });
});

module.exports = { getMyNotifications, markAllRead };