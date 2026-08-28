const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

// Fair ordering: points desc, then earliest joiner wins ties
const SORT = { points: -1, createdAt: 1 };

const getLeaderboard = asyncHandler(async (req, res) => {
  const users = await User.find({ isBanned: false })
    .sort(SORT)
    .limit(50)
    .select('firstName lastName username avatarUrl university points');
  res.json(users);
});

const getMyRank = asyncHandler(async (req, res) => {
  const users = await User.find({ isBanned: false }).select('_id points').sort(SORT);
  const idx = users.findIndex((u) => u._id.toString() === req.user._id.toString());
  res.json({ rank: idx + 1, points: (users[idx] && users[idx].points) || 0 });
});

module.exports = { getLeaderboard, getMyRank };