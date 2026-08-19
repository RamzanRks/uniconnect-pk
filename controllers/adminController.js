const asyncHandler = require('../utils/asyncHandler');
const Report = require('../models/Report');
const ProjectPost = require('../models/ProjectPost');
const Question = require('../models/Question');
const User = require('../models/User');

// @desc    Get all pending reports (bulletproof version)
// @route   GET /api/admin/reports
const getPendingReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .populate('reporter', 'firstName lastName email');

  const enriched = [];

  for (const r of reports) {
    let targetInfo = null;

    try {
      if (r.targetType === 'ProjectPost') {
        const post = await ProjectPost.findById(r.targetId)
          .populate('creator', 'firstName lastName email university');
        if (post) {
          targetInfo = { _id: post._id, title: post.title, body: post.description, creator: post.creator, type: 'Project' };
        }
      } else if (r.targetType === 'QA_Post') {
        const q = await Question.findById(r.targetId)
          .populate('author', 'firstName lastName email university');
        if (q) {
          targetInfo = { _id: q._id, title: q.title, body: q.content, creator: q.author, type: 'Question' };
        }
      }
    } catch (e) {
      console.error('?? Skipped a broken report target:', e.message);
    }

    enriched.push({ ...r.toObject(), targetInfo });
  }

  res.json(enriched);
});

// @desc    Delete a troll post & resolve its reports
// @route   DELETE /api/admin/projects/:id
const deletePost = asyncHandler(async (req, res) => {
  const id = req.params.id;
  let post = await ProjectPost.findById(id);
  if (!post) post = await Question.findById(id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  await post.deleteOne();
  await Report.updateMany({ targetId: id }, { status: 'resolved' });
  res.json({ message: 'Post deleted and reports resolved.' });
});

// @desc    Ban a user & hide ALL their content
// @route   PUT /api/admin/users/:id/ban
const banUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.isBanned = true;
  await user.save();
  await ProjectPost.updateMany({ creator: user._id }, { status: 'hidden' });
  await Question.updateMany({ author: user._id }, { status: 'hidden' });
  res.json({ message: 'User banned and all their content hidden.' });
});

// @desc    Get users waiting for verification
// @route   GET /api/admin/verifications
const getPendingVerifications = asyncHandler(async (req, res) => {
  const users = await User.find({ verificationStatus: 'pending' }).select('-password');
  res.json(users);
});

// @desc    Approve a user's verification
// @route   PUT /api/admin/verifications/:id/approve
const approveVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.verificationStatus = 'verified';
  await user.save();
  res.json({ message: 'User verified successfully.' });
});

// @desc    Reject a user's verification
// @route   PUT /api/admin/verifications/:id/reject
const rejectVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.verificationStatus = 'unverified';
  user.idCardUrl = undefined;
  await user.save();
  res.json({ message: 'Verification rejected.' });
});

module.exports = {
  getPendingReports,
  deletePost,
  banUser,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
};