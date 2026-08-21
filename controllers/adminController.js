const asyncHandler = require('../utils/asyncHandler');
const Report = require('../models/Report');
const ProjectPost = require('../models/ProjectPost');
const Question = require('../models/Question');
const User = require('../models/User');
const Application = require('../models/Application');
const { notifyUser } = require('../utils/socket');


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
      } else if (r.targetType === 'User') {
        const u = await User.findById(r.targetId);
        if (u) {
          targetInfo = { _id: u._id, title: `${u.firstName} ${u.lastName}'s profile`, body: `Reported area: ${r.targetArea || 'profile'}`, creator: null, type: 'User' };
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
    await notifyUser(user._id, 'verification_approved', 'Your student ID was approved. You are now a ✅ Verified Student!', '/profile');
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
  
    await notifyUser(user._id, 'verification_rejected', 'Your verification request was rejected. Please upload a clearer ID card.', '/profile');
  res.json({ message: 'Verification rejected.' });
});

// @desc    Platform analytics (aggregation pipelines)
// @route   GET /api/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    verifiedUsers,
    pendingVerifications,
    totalProjects,
    totalQuestions,
    totalApplications,
    acceptedApplications,
    totalReports,
    pendingReports,
    usersByUniversity,
    reportsByReason,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ verificationStatus: 'verified' }),
    User.countDocuments({ verificationStatus: 'pending' }),
    ProjectPost.countDocuments(),
    Question.countDocuments(),
    Application.countDocuments(),
    Application.countDocuments({ status: 'accepted' }),
    Report.countDocuments(),
    Report.countDocuments({ status: 'pending' }),
    User.aggregate([
      { $group: { _id: '$university', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    Report.aggregate([
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.json({
    totals: {
      totalUsers,
      verifiedUsers,
      pendingVerifications,
      totalProjects,
      totalQuestions,
      totalApplications,
      acceptedApplications,
      totalReports,
      pendingReports,
    },
    usersByUniversity,
    reportsByReason,
  });
});

// @desc    Drill-down lists for analytics (full control)
// @route   GET /api/admin/list/:type
const getList = asyncHandler(async (req, res) => {
  const { type } = req.params;
  let data = [];

  switch (type) {
    case 'users':
      data = await User.find().select('-password').sort({ createdAt: -1 });
      break;
    case 'verified':
      data = await User.find({ verificationStatus: 'verified' }).select('-password').sort({ createdAt: -1 });
      break;
    case 'projects':
      data = await ProjectPost.find().sort({ createdAt: -1 })
        .populate('creator', 'firstName lastName email university');
      break;
    case 'questions':
      data = await Question.find().sort({ createdAt: -1 })
        .populate('author', 'firstName lastName email university');
      break;
    case 'applications':
      data = await Application.find().sort({ createdAt: -1 })
        .populate('applicant', 'firstName lastName email')
        .populate({ path: 'project', select: 'title' });
      break;
    case 'accepted':
      data = await Application.find({ status: 'accepted' }).sort({ createdAt: -1 })
        .populate('applicant', 'firstName lastName email')
        .populate({ path: 'project', select: 'title' });
      break;
    case 'reports':
      data = await Report.find().sort({ createdAt: -1 })
        .populate('reporter', 'firstName lastName');
      break;
    default:
      res.status(400);
      throw new Error('Invalid list type');
  }

  res.json(data);
});

// @desc    Pending name-change requests
// @route   GET /api/admin/name-changes
const getNameChanges = asyncHandler(async (req, res) => {
    const users = await User.find({ 'nameChangeRequest.firstName': { $exists: true, $ne: null } }).select('-password');
  res.json(users);
});

// @desc    Approve name change
// @route   PUT /api/admin/name-changes/:id/approve
const approveNameChange = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
   if (!user || !user.nameChangeRequest?.firstName) { res.status(404); throw new Error('No pending name change'); }
  user.firstName = user.nameChangeRequest.firstName;
  user.lastName = user.nameChangeRequest.lastName;
  user.nameChangeRequest = undefined;
  await user.save();
  await notifyUser(user._id, 'name_change_approved', 'Your name change was approved by the admin.', '/profile');
  res.json({ message: 'Name change approved.' });
});

// @desc    Reject name change
// @route   PUT /api/admin/name-changes/:id/reject
const rejectNameChange = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
   if (!user || !user.nameChangeRequest?.firstName) { res.status(404); throw new Error('No pending name change'); }
  user.nameChangeRequest = undefined;
  await user.save();
  await notifyUser(user._id, 'name_change_rejected', 'Your name change request was rejected.', '/profile');
  res.json({ message: 'Name change rejected.' });
});

module.exports = {
  getPendingReports,
  deletePost,
  banUser,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getStats,
  getList,
  getNameChanges,
  approveNameChange,
  rejectNameChange,
};