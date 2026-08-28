const User = require('../models/User');

const awardPoints = async (userId, amount) => {
  if (!userId) return;
  await User.findByIdAndUpdate(userId, { $inc: { points: amount } });
};

module.exports = { awardPoints };