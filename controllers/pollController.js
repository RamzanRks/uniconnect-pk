const asyncHandler = require('../utils/asyncHandler');
const Poll = require('../models/Poll');
const ProjectPost = require('../models/ProjectPost');
const { notifyUser } = require('../utils/socket');
const { logAudit } = require('../utils/audit');

const isExpired = (p) => p.closed || (p.closesAt && new Date(p.closesAt) < new Date());

const getPolls = asyncHandler(async (req, res) => {
  const polls = await Poll.find({ project: req.params.id }).sort({ createdAt: -1 }).populate('creator', 'firstName lastName');
  res.json(polls);
});

const createPoll = asyncHandler(async (req, res) => {
  const post = await ProjectPost.findById(req.params.id);
  if (!post) { res.status(404); throw new Error('Project not found'); }
  if (post.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') { res.status(403); throw new Error('Only the project owner can create polls.'); }
  const { question, options, multiple, closesAt } = req.body;
  if (!question || !Array.isArray(options) || options.length < 2 || options.length > 5) { res.status(400); throw new Error('Poll needs a question and 2-5 options.'); }
  const poll = await Poll.create({
    project: post._id, creator: req.user._id, question, multiple: !!multiple,
    closesAt: closesAt ? new Date(closesAt) : undefined,
    options: options.map((t) => ({ text: String(t).slice(0, 60), votes: [] })),
  });
  const team = post.team || [];
  for (const m of team) await notifyUser(m, 'system', `📊 New poll on "${post.title}": ${question}`, `/project/${post._id}`);
  res.status(201).json(poll);
});

const votePoll = asyncHandler(async (req, res) => {
  const poll = await Poll.findById(req.params.id);
  if (!poll) { res.status(404); throw new Error('Poll not found'); }
  if (isExpired(poll)) { res.status(400); throw new Error('This poll is closed.'); }
  const post = await ProjectPost.findById(poll.project);
  const isTeam = post && (post.creator.toString() === req.user._id.toString() || (post.team || []).some((t) => t.toString() === req.user._id.toString()));
  if (!isTeam && req.user.role !== 'admin') { res.status(403); throw new Error('Only team members can vote.'); }
  const idx = Number(req.body.optionIndex);
  if (!poll.options[idx]) { res.status(400); throw new Error('Invalid option'); }
  const uid = req.user._id.toString();
  if (poll.multiple) {
    const has = poll.options[idx].votes.some((v) => v.toString() === uid);
    poll.options[idx].votes = has ? poll.options[idx].votes.filter((v) => v.toString() !== uid) : [...poll.options[idx].votes, req.user._id];
  } else {
    poll.options.forEach((o) => { o.votes = o.votes.filter((v) => v.toString() !== uid); });
    poll.options[idx].votes = [req.user._id];
  }
  await poll.save();
  res.json(poll);
});

const closePoll = asyncHandler(async (req, res) => {
  const poll = await Poll.findById(req.params.id);
  if (!poll) { res.status(404); throw new Error('Poll not found'); }
  if (poll.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') { res.status(403); throw new Error('Not authorized'); }
  poll.closed = true;
  await poll.save();
  res.json(poll);
});

const deletePoll = asyncHandler(async (req, res) => {
  const poll = await Poll.findById(req.params.id);
  if (!poll) { res.status(404); throw new Error('Poll not found'); }
  if (poll.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') { res.status(403); throw new Error('Not authorized'); }
  await poll.deleteOne();
  await logAudit(req.user._id, 'DELETE_POLL', 'Poll', poll.question, '', req.ip);
  res.json({ message: 'Poll deleted.' });
});

module.exports = { getPolls, createPoll, votePoll, closePoll, deletePoll };