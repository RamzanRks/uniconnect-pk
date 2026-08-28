const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const ProjectPost = require('../models/ProjectPost');

// @desc    Get University Hub stats
// @route   GET /api/hubs/:university
const getHub = asyncHandler(async (req, res) => {
  const university = decodeURIComponent(req.params.university);
  
  const users = await User.find({ university, isBanned: false });
  const userIds = users.map((u) => u._id);
  
  const [totalStudents, verifiedStudents, topSkills, topStudents] = await Promise.all([
    User.countDocuments({ university, isBanned: false }),
    User.countDocuments({ university, verificationStatus: 'verified', isBanned: false }),
    User.aggregate([
      { $match: { university, isBanned: false } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    User.find({ university, isBanned: false })
      .sort({ points: -1 })
      .limit(10)
      .select('firstName lastName username avatarUrl points'),
  ]);

  res.json({
    university,
    totalStudents,
    verifiedStudents,
    topSkills,
    topStudents,
  });
});

module.exports = { getHub };