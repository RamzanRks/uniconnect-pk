const asyncHandler = require('../utils/asyncHandler');
const ProjectPost = require('../models/ProjectPost');
const Report = require('../models/Report');

// @desc    Report a project post
// @route   POST /api/reports/project/:id
// @access  Private
const reportProjectPost = asyncHandler(async (req, res) => {
  const { reason, details } = req.body;
  const postId = req.params.id;

  const post = await ProjectPost.findById(postId);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  // Prevent users from reporting the same post multiple times
  if (post.reportedBy.includes(req.user._id)) {
    res.status(400);
    throw new Error('You have already reported this post.');
  }

  // 1. Increment counters
  post.reportCount += 1;
  post.reportedBy.push(req.user._id);

  // 2. Save the post (This triggers the Model's pre('save') hook which auto-hides it if count >= 3)
  await post.save();

  // 3. Create an Audit Log for the Admin Dashboard
  await Report.create({
    targetType: 'ProjectPost',
    targetId: post._id,
    reporter: req.user._id,
    reason,
    details,
    status: 'pending'
  });

  res.status(200).json({ 
    message: 'Report submitted. Our moderation team will review it shortly.' 
  });
});

module.exports = { reportProjectPost };