const asyncHandler = require('../utils/asyncHandler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ProjectPost = require('../models/ProjectPost');
const Application = require('../models/Application');
const { emitToUser } = require('../utils/socket');

// @desc    Open (or get) a chat between owner & accepted teammate
// @route   POST /api/messages/open
const openConversation = asyncHandler(async (req, res) => {
  const { projectId, applicantId } = req.body;
  const project = await ProjectPost.findById(projectId);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const isOwner = project.creator.toString() === req.user._id.toString();
  let otherId;

  if (isOwner) {
    if (!applicantId) {
      res.status(400);
      throw new Error('applicantId is required');
    }
    const ok = await Application.findOne({ project: project._id, applicant: applicantId, status: 'accepted' });
    if (!ok) {
      res.status(403);
      throw new Error('You can only chat with accepted teammates.');
    }
    otherId = applicantId;
  } else {
    const ok = await Application.findOne({ project: project._id, applicant: req.user._id, status: 'accepted' });
    if (!ok) {
      res.status(403);
      throw new Error('Chat unlocks after your application is accepted.');
    }
    otherId = project.creator.toString();
  }

  let convo = await Conversation.findOne({
    project: project._id,
    participants: { $all: [req.user._id, otherId] },
  });

  if (!convo) {
    convo = await Conversation.create({
      project: project._id,
      participants: [req.user._id, otherId],
    });
  }

  res.json(convo);
});

// @desc    My conversations
// @route   GET /api/messages/conversations
const getMyConversations = asyncHandler(async (req, res) => {
  const convos = await Conversation.find({ participants: req.user._id })
    .sort({ lastMessageAt: -1 })
    .populate('participants', 'firstName lastName university')
    .populate('project', 'title');
  res.json(convos);
});

// @desc    Get messages of a conversation (marks them read)
// @route   GET /api/messages/conversation/:id
const getMessages = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  if (!convo.participants.some((p) => p.toString() === req.user._id.toString())) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const messages = await Message.find({ conversation: convo._id })
    .sort({ createdAt: 1 })
    .populate('sender', 'firstName lastName');

  await Message.updateMany(
    { conversation: convo._id, sender: { $ne: req.user._id } },
    { read: true }
  );

  res.json(messages);
});

// @desc    Send a message (real-time)
// @route   POST /api/messages/conversation/:id
const sendMessage = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  if (!convo.participants.some((p) => p.toString() === req.user._id.toString())) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const msg = await Message.create({
    conversation: convo._id,
    sender: req.user._id,
    text: req.body.text,
  });

  convo.lastMessageAt = Date.now();
  await convo.save();

  const populated = await Message.findById(msg._id).populate('sender', 'firstName lastName');

  const otherId = convo.participants.find((p) => p.toString() !== req.user._id.toString());
  emitToUser(otherId, 'message', populated);

  res.status(201).json(populated);
});

module.exports = { openConversation, getMyConversations, getMessages, sendMessage };