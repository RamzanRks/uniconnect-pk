const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const Rating = require('../models/Rating');
const ProjectPost = require('../models/ProjectPost');
const Application = require('../models/Application');
const { notifyUser } = require('../utils/socket');

// @desc    Rate a project's team (anyone EXCEPT owner/teammates can rate)
// @route   POST /api/ratings
const createRating = asyncHandler(async (req, res) => {
  const { ratee, project, stars, comment } = req.body;
  const p = await ProjectPost.findById(project);
  if (!p) { res.status(404); throw new Error('Project not found'); }

  if (String(ratee) === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot rate yourself.');
  }

  // Build the project's participant list: owner + accepted teammates
  const participants = [String(p.creator)];
  const accepted = await Application.find({ project: p._id, status: 'accepted' }).select('applicant');
  accepted.forEach((a) => participants.push(String(a.applicant)));

  // The RATER must NOT be a participant (outsiders rate the team)
  if (participants.includes(String(req.user._id))) {
    res.status(403);
    throw new Error('Project owners and teammates cannot rate their own project.');
  }

  // The RATEE must BE a participant (you can only rate someone who worked on it)
  if (!participants.includes(String(ratee))) {
    res.status(400);
    throw new Error('You can only rate someone who is part of this project.');
  }

  const rating = await Rating.findOneAndUpdate(
    { rater: req.user._id, ratee, project: p._id },
    { stars, comment: comment || '' },
    { upsert: true, new: true }
  );

  await notifyUser(ratee, 'rating', `${req.user.firstName} ${req.user.lastName} rated you ${stars}⭐`, `/user/${req.user._id}`);
  
  // Award points based on stars (10 points for 5 stars, less for lower)
  const { awardPoints } = require('../utils/points');
  const pointsMap = { 1: 2, 2: 4, 3: 6, 4: 8, 5: 10 };
  await awardPoints(ratee, pointsMap[stars] || 0);

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