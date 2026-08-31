const asyncHandler = require('../utils/asyncHandler');
const Comment = require('../models/Comment');
const CommentVote = require('../models/CommentVote');
const ProjectPost = require('../models/ProjectPost');
const Report = require('../models/Report');
const User = require('../models/User');
const { containsProfanity } = require('../utils/profanity');
const { notifyUser } = require('../utils/socket');

// @desc    Get threaded comments for a project (with scores + my votes)
// @route   GET /api/comments/project/:id
const getComments = asyncHandler(async (req, res) => {
  const all = await Comment.find({ project: req.params.id, hidden: false })
    .sort({ createdAt: 1 })
    .populate('author', 'firstName lastName avatarUrl');

  const ids = all.map((c) => c._id);
  const [scores, myVotes] = await Promise.all([
    CommentVote.aggregate([
      { $match: { comment: { $in: ids } } },
      { $group: { _id: '$comment', score: { $sum: '$value' } } },
    ]),
    req.user ? CommentVote.find({ user: req.user._id, comment: { $in: ids } }) : [],
  ]);

  const scoreMap = Object.fromEntries(scores.map((s) => [s._id.toString(), s.score]));
  const voteMap = Object.fromEntries(myVotes.map((v) => [v.comment.toString(), v.value]));

  const flat = all.map((c) => ({
    ...c.toObject(),
    score: scoreMap[c._id.toString()] || 0,
    myVote: voteMap[c._id.toString()] || 0,
  }));

  const top = flat.filter((c) => !c.parent);
  const withReplies = top.map((c) => ({ ...c, replies: flat.filter((r) => r.parent && r.parent.toString() === c._id.toString()) }));

  res.json(withReplies);
});

// @desc    Create a comment (1-level threads) with profanity filter
// @route   POST /api/comments/project/:id
const createComment = asyncHandler(async (req, res) => {
  const { text, parent } = req.body;
  if (containsProfanity(text)) {
    res.status(400);
    throw new Error('Abusive language is not allowed. Keep it professional.');
  }

  let parentId = null;
  if (parent) {
    const p = await Comment.findById(parent);
    if (p) parentId = p.parent ? p.parent : p._id; // force 1 level
  }

  const comment = await Comment.create({
    project: req.params.id,
    author: req.user._id,
    text,
    parent: parentId,
  });

  const post = await ProjectPost.findById(req.params.id);
  if (post && post.creator.toString() !== req.user._id.toString()) {
    await notifyUser(post.creator, 'reaction', `${req.user.firstName} commented on "${post.title}"`, `/project/${post._id}`);
  }

  res.status(201).json(await comment.populate('author', 'firstName lastName avatarUrl'));
});

// @desc    Upvote / downvote a comment (toggle)
// @route   POST /api/comments/:id/vote
const voteComment = asyncHandler(async (req, res) => {
  const { value } = req.body; // 1 or -1
  if (![1, -1].includes(Number(value))) { res.status(400); throw new Error('Invalid vote'); }

  const existing = await CommentVote.findOne({ comment: req.params.id, user: req.user._id });
  if (existing && existing.value === Number(value)) {
    await existing.deleteOne(); // toggle off
  } else if (existing) {
    existing.value = Number(value);
    await existing.save();
  } else {
    await CommentVote.create({ comment: req.params.id, user: req.user._id, value: Number(value) });
  }

  const score = await CommentVote.aggregate([
    { $match: { comment: req.params.id } },
    { $group: { _id: null, score: { $sum: '$value' } } },
  ]);
  res.json({ score: score[0] ? score[0].score : 0 });
});

// @desc    Report an abusive comment (3 reports = auto-hide)
// @route   POST /api/comments/:id/report
const reportComment = asyncHandler(async (req, res) => {
  const { reason, details } = req.body;
  const comment = await Comment.findById(req.params.id);
  if (!comment) { res.status(404); throw new Error('Comment not found'); }
  if (comment.reportedBy.includes(req.user._id)) { res.status(400); throw new Error('Already reported.'); }

  comment.reportCount += 1;
  comment.reportedBy.push(req.user._id);
  await comment.save();

  await Report.create({ targetType: 'Comment', targetId: comment._id, reporter: req.user._id, reason: reason || 'Inappropriate Content', details: details || '', status: 'pending' });

  const admins = await User.find({ role: 'admin' }).select('_id');
  for (const a of admins) await notifyUser(a._id, 'warning', `🚩 Comment reported (${reason || 'Abuse'}). Review in Admin Panel.`, '/admin');

  res.json({ message: 'Report submitted. Moderation will review it.' });
});

// @desc    Delete a comment (author / project owner / admin)
// @route   DELETE /api/comments/:id
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) { res.status(404); throw new Error('Comment not found'); }
  const post = await ProjectPost.findById(comment.project);
  const isOwner = comment.author.toString() === req.user._id.toString();
  const isPostOwner = post && post.creator.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isPostOwner && !isAdmin) { res.status(403); throw new Error('Not authorized'); }
  await Comment.deleteMany({ $or: [{ _id: comment._id }, { parent: comment._id }] });
  res.json({ message: 'Comment deleted.' });
});

module.exports = { getComments, createComment, voteComment, reportComment, deleteComment };