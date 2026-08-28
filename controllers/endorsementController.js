const asyncHandler = require('../utils/asyncHandler');
const Endorsement = require('../models/Endorsement');
const User = require('../models/User');
const { notifyUser } = require('../utils/socket');

// @desc    Endorse a user's skill (toggle)
// @route   POST /api/endorsements
const toggleEndorsement = asyncHandler(async (req, res) => {
  const { endorseeId, skill } = req.body;
  if (String(endorseeId) === String(req.user._id)) {
    res.status(400);
    throw new Error('Cannot endorse yourself.');
  }

  const target = await User.findById(endorseeId);
  if (!target || !target.skills.includes(skill)) {
    res.status(404);
    throw new Error('Skill not found on user profile.');
  }

  const existing = await Endorsement.findOne({ endorser: req.user._id, endorsee: endorseeId, skill });
  if (existing) {
    await existing.deleteOne();
  } else {
    try {
      await Endorsement.create({ endorser: req.user._id, endorsee: endorseeId, skill });
      await notifyUser(endorseeId, 'endorsement', `${req.user.firstName} endorsed you for "${skill}"`, `/user/${req.user._id}`);
    } catch (e) {
      if (e.code !== 11000) throw e; // double-click duplicate = already endorsed, ignore
    }
  }

  const counts = await Endorsement.aggregate([
    { $match: { endorsee: target._id } },
    { $group: { _id: '$skill', count: { $sum: 1 } } },
  ]);
  res.json(counts);
});

// @desc    Get endorsements for a user (+ which ones I gave)
// @route   GET /api/endorsements/:userId
const getEndorsements = asyncHandler(async (req, res) => {
  const counts = await Endorsement.aggregate([
    { $match: { endorsee: req.params.userId } },
    { $group: { _id: '$skill', count: { $sum: 1 } } },
  ]);
  let mine = [];
  if (req.user) {
    mine = await Endorsement.find({ endorser: req.user._id, endorsee: req.params.userId }).distinct('skill');
  }
  res.json({ counts, mine });
});

module.exports = { toggleEndorsement, getEndorsements };