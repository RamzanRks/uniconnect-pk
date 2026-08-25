const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const Rating = require('../models/Rating');
const ProjectPost = require('../models/ProjectPost');
const Application = require('../models/Application');
const { notifyUser } = require('../utils/socket');

// @desc    Rate a teammate (only completed-project teammates or owner)
// @route   POST /api/ratings
const createRating = asyncHandler(async (req, res) => {
  const { ratee, project, stars, comment } = req.body;
  const p = await ProjectPost.findById(project);
  if (!p) { res.status(404); throw new Error('Project not found'); }

  const isOwner = p.creator.toString() === req.user._id.toString();
  const isTeammate = await Application.findOne({ project: p._id, applicant: req.user._id, status: 'accepted' });
  if (!isOwner && !isTeammate) { res.status(403); throw new Error('Only project teammates can rate.'); }
  if (ratee === req.user._id.toString()) { res.status(400); throw new Error('You cannot rate yourself.'); }

  const rating = await Rating.findOneAndUpdate(
    { rater: req.user._id, ratee, project: p._id },
    { stars, comment: comment || '' },
    { upsert: true, new: true }
  );

  await notifyUser(ratee, 'rating', `${req.user.firstName} ${req.user.lastName} rated you ${stars}⭐`, `/user/${req.user._id}`);
  res.json(rating);
});

// @desc    Get a user's ratings + average
// @route   GET /api/ratings/user/:id
const getUserRatings = asyncHandler(async (req, res) => {
  const ratings = await Rating.find({ ratee: req.params.id })
    .sort({ createdAt: -1 })
    .populate('rater', 'firstName lastName avatarUrl');
  const agg = await Rating.aggregate([
    { $match: { ratee: new mongoose.Types.ObjectId(req.params.id) } },
    { $group: { _id: null, avg: { $avg: '$stars' }, count: { $sum: 1 } } },
  ]);
  res.json({
    ratings,
    avg: agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0,
    count: agg[0] ? agg[0].count : 0,
  });
});

module.exports = { createRating, getUserRatings };