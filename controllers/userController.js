const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const ProjectPost = require('../models/ProjectPost');
const Question = require('../models/Question');
const Report = require('../models/Report');
const { notifyUser } = require('../utils/socket');

// @desc    Check username availability
// @route   GET /api/users/username/:username/available
const checkUsername = asyncHandler(async (req, res) => {
  const uname = String(req.params.username).toLowerCase().trim();
  const exists = await User.findOne({ username: uname });
  res.json({ available: !exists });
});

// @desc    Public profile (visible to everyone)
// @route   GET /api/users/:id
const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('followers', 'firstName lastName username avatarUrl')
    .populate('following', 'firstName lastName username avatarUrl');
  if (!user) { res.status(404); throw new Error('User not found'); }

  const projects = await ProjectPost.find({ creator: user._id, status: 'open' })
    .sort({ createdAt: -1 }).limit(5);
  const questions = await Question.find({ author: user._id, status: 'open' })
    .sort({ createdAt: -1 }).limit(5);

  res.json({ user, projects, questions });
});

// @desc    Follow a user
// @route   POST /api/users/:id/follow
const followUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) { res.status(404); throw new Error('User not found'); }
  if (target._id.toString() === req.user._id.toString()) { res.status(400); throw new Error('You cannot follow yourself'); }

  if (!target.followers.some((id) => id.toString() === req.user._id.toString())) {
    target.followers.push(req.user._id);
    req.user.following.push(target._id);
    await target.save();
    await req.user.save();
    await notifyUser(target._id, 'follow', `${req.user.firstName} ${req.user.lastName} started following you.`, `/user/${req.user._id}`);
  }
  res.json({ message: 'Followed' });
});

// @desc    Unfollow a user
// @route   POST /api/users/:id/unfollow
const unfollowUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) { res.status(404); throw new Error('User not found'); }
  target.followers = target.followers.filter((id) => id.toString() !== req.user._id.toString());
  req.user.following = req.user.following.filter((id) => id.toString() !== target._id.toString());
  await target.save();
  await req.user.save();
  res.json({ message: 'Unfollowed' });
});

// @desc    Remove a follower
// @route   POST /api/users/:id/remove-follower
const removeFollower = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) { res.status(404); throw new Error('User not found'); }
  req.user.followers = req.user.followers.filter((id) => id.toString() !== target._id.toString());
  target.following = target.following.filter((id) => id.toString() !== req.user._id.toString());
  await req.user.save();
  await target.save();
  res.json({ message: 'Follower removed' });
});

// @desc    Followers / following lists
// @route   GET /api/users/:id/followers | /following
const getFollowers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('followers', 'firstName lastName username avatarUrl university');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json(user.followers);
});

const getFollowing = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('following', 'firstName lastName username avatarUrl university');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json(user.following);
});

// @desc    Report a user's profile / dp / info
// @route   POST /api/users/:id/report
const reportUser = asyncHandler(async (req, res) => {
  const { reason, details, targetArea } = req.body;
  const target = await User.findById(req.params.id);
  if (!target) { res.status(404); throw new Error('User not found'); }

  await Report.create({
    targetType: 'User',
    targetId: target._id,
    reporter: req.user._id,
    reason,
    details,
    targetArea: targetArea || 'other',
  });

  res.json({ message: 'Report submitted. Our moderation team will review it shortly.' });
});

module.exports = {
  checkUsername, getPublicProfile, followUser, unfollowUser,
  removeFollower, getFollowers, getFollowing, reportUser,
};