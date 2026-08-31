const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const ProjectPost = require('../models/ProjectPost');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Report = require('../models/Report');
const Rating = require('../models/Rating');
const ProfileView = require('../models/ProfileView');
const { notifyUser, isOnline } = require('../utils/socket');

// @desc    Check username availability
// @route   GET /api/users/username/:username/available
const checkUsername = asyncHandler(async (req, res) => {
  const uname = String(req.params.username).toLowerCase().trim();
  const exists = await User.findOne({ username: uname });
  res.json({ available: !exists });
});

// @desc    Public profile (visible to everyone) + views + badges + pins
// @route   GET /api/users/:id
const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('followers', 'firstName lastName username avatarUrl')
    .populate('following', 'firstName lastName username avatarUrl');
  if (!user) { res.status(404); throw new Error('User not found'); }

  // NEW: record profile view (once per viewer per 24h)
  if (req.user && req.user._id.toString() !== user._id.toString()) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const seen = await ProfileView.findOne({ owner: user._id, viewer: req.user._id, viewedAt: { $gte: dayAgo } });
    if (!seen) await ProfileView.create({ owner: user._id, viewer: req.user._id });
  }
  const viewCount = await ProfileView.countDocuments({ owner: user._id });

  const projects = await ProjectPost.find({ creator: user._id, status: { $ne: 'hidden' } })
    .sort({ createdAt: -1 }).limit(5);
  const questions = await Question.find({ author: user._id, status: 'open' })
    .sort({ createdAt: -1 }).limit(5);
  const pinnedProjects = await ProjectPost.find({ _id: { $in: user.pinnedProjects } });

  const ratingAgg = await Rating.aggregate([
    { $match: { ratee: user._id } },
    { $group: { _id: null, avg: { $avg: '$stars' }, count: { $sum: 1 } } },
  ]);
  const avgRating = ratingAgg[0] ? Math.round(ratingAgg[0].avg * 10) / 10 : 0;
  const ratingCount = ratingAgg[0] ? ratingAgg[0].count : 0;
  const acceptedAnswers = await Answer.countDocuments({ author: user._id, isAccepted: true });

  // NEW: auto badges
  const badges = [];
  if (user.verificationStatus === 'verified') badges.push('✅ Verified');
  if ((user.followers || []).length >= 10) badges.push('🌟 Rising Star');
  if (acceptedAnswers >= 5) badges.push('🧠 Top Answerer');
  if (avgRating >= 4.5 && ratingCount >= 1) badges.push('🤝 Trusted Teammate');
  if (user.role === 'admin') badges.push('🛡️ Admin');

  res.json({ user, projects, questions, pinnedProjects, viewCount, badges, avgRating, ratingCount });
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

// @desc    Followers list
// @route   GET /api/users/:id/followers
const getFollowers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('followers', 'firstName lastName username avatarUrl university');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json(user.followers);
});

// @desc    Following list
// @route   GET /api/users/:id/following
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

    const admins = await User.find({ role: 'admin' }).select('_id');
  for (const a of admins) {
    await notifyUser(a._id, 'warning', `🚩 New profile report (${reason}). Review in Admin Panel.`, '/admin');
  }
  res.json({ message: 'Report submitted. Our moderation team will review it shortly.' });
});

// @desc    Activity feed for a user (projects, questions, answers, ratings)
// @route   GET /api/users/:id/activity
const getActivity = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const [projects, questions, answers, ratings] = await Promise.all([
    ProjectPost.find({ creator: id, status: { $ne: 'hidden' } }).select('title progress createdAt').limit(10),
    Question.find({ author: id }).select('title createdAt').limit(10),
    Answer.find({ author: id }).select('content isAccepted createdAt').limit(10),
    Rating.find({ ratee: id }).select('stars comment createdAt').limit(10),
  ]);
  const activity = [
    ...projects.map((p) => ({ type: 'project', text: p.title, extra: p.progress, date: p.createdAt })),
    ...questions.map((q) => ({ type: 'question', text: q.title, date: q.createdAt })),
    ...answers.map((a) => ({ type: 'answer', text: a.content.slice(0, 80), extra: a.isAccepted, date: a.createdAt })),
    ...ratings.map((r) => ({ type: 'rating', text: `${r.stars}⭐ ${r.comment || ''}`, date: r.createdAt })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
  res.json(activity);
});

// @desc    Who viewed my profile
// @route   GET /api/users/me/views
const getMyProfileViews = asyncHandler(async (req, res) => {
  const views = await ProfileView.find({ owner: req.user._id })
    .sort({ viewedAt: -1 }).limit(30)
    .populate('viewer', 'firstName lastName username avatarUrl university');
  res.json(views);
});

// @desc    Toggle a followed topic
// @route   POST /api/users/topics/:tag/toggle
const toggleTopic = asyncHandler(async (req, res) => {
  const tag = String(req.params.tag).toLowerCase().trim();
  const user = await User.findById(req.user._id);
  if (user.followedTopics.includes(tag)) {
    user.followedTopics = user.followedTopics.filter((t) => t !== tag);
  } else {
    user.followedTopics.push(tag);
  }
  await user.save();
  res.json({ followedTopics: user.followedTopics });
});

// @desc    Popular topics across all projects
// @route   GET /api/users/topics/popular
const getPopularTopics = asyncHandler(async (req, res) => {
  const skills = await ProjectPost.aggregate([
    { $unwind: '$requiredSkills' },
    { $group: { _id: '$requiredSkills', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 12 },
  ]);
  res.json(skills.map((s) => ({ tag: s._id, count: s.count })));
});

// @desc    Online presence for given user ids
// @route   GET /api/users/presence?ids=a,b,c
const getPresence = asyncHandler(async (req, res) => {
  const ids = String(req.query.ids || '').split(',').filter(Boolean);
  const result = {};
  ids.forEach((id) => { result[id] = isOnline(id); });
  res.json(result);
});

// @desc    Explore people to connect with
// @route   GET /api/users/explore
const getExplore = asyncHandler(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id }, isBanned: false })
    .select('firstName lastName username avatarUrl university points')
    .sort({ createdAt: -1 })
    .limit(10);
  res.json(users);
});

// @desc    Block / unblock a user
// @route   POST /api/users/:id/block  |  /unblock
const blockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.blockedUsers.some((id) => id.toString() === req.params.id)) user.blockedUsers.push(req.params.id);
  await user.save();
  res.json({ message: 'User blocked. They can no longer message you.' });
});

const unblockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== req.params.id);
  await user.save();
  res.json({ message: 'User unblocked.' });
});

// @desc    Public portfolio by @username or id (with weekly views)
// @route   GET /api/users/portfolio/:handle
const getPublicPortfolio = asyncHandler(async (req, res) => {
  const { handle } = req.params;
  const isId = /^[a-f0-9]{24}$/.test(handle);
  const user = isId ? await User.findById(handle) : await User.findOne({ username: String(handle).toLowerCase() });
  if (!user || user.isBanned) { res.status(404); throw new Error('Profile not found'); }

  const viewerId = req.user._id.toString();
  const last = user.viewCooldown ? user.viewCooldown.get(viewerId) : null;
  const COOLDOWN = 30 * 60 * 1000; // same visitor counts once per 30 min
  if (!last || Date.now() - new Date(last).getTime() > COOLDOWN) {
    user.viewCount = (user.viewCount || 0) + 1;
    const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    user.viewLog = [...(user.viewLog || []).filter((d) => new Date(d) > monthAgo), new Date()].slice(-300);
    if (!user.viewCooldown) user.viewCooldown = new Map();
    if (user.viewCooldown.size > 500) user.viewCooldown.clear();
    user.viewCooldown.set(viewerId, new Date());
    console.log(`👀 Portfolio view counted: ${user.username || user.email} -> Total: ${user.viewCount}`);
    await user.save();
  }
  const weekViews = user.viewLog.filter((d) => new Date(d) > new Date(Date.now() - 7 * 24 * 3600 * 1000)).length;

  const [projects, questions] = await Promise.all([
    ProjectPost.find({ creator: user._id, status: { $ne: 'hidden' } }).sort({ createdAt: -1 }).limit(6),
    Question.find({ author: user._id, status: 'open' }).limit(5),
  ]);

  res.json({ user: user.toObject(), weekViews, projects, questions });
});


// @desc    Alumni directory (graduated filter)
const getAlumni = asyncHandler(async (req, res) => {
  const { uni, year } = req.query;
  const q = { graduated: true, isBanned: false };
  if (uni) q.university = uni;
  if (year) q.graduationYear = Number(year);
  const users = await User.find(q)
    .select('firstName lastName avatarUrl username university graduationYear company points mentor openToRefer')
    .sort({ points: -1 }).limit(50);
  res.json(users);
});

module.exports = {
  checkUsername, getPublicProfile, followUser, unfollowUser,
  removeFollower, getFollowers, getFollowing, reportUser,
  getActivity, getMyProfileViews, toggleTopic, getPopularTopics, getPresence, getExplore,blockUser, unblockUser, getPublicPortfolio, getAlumni,
}; 