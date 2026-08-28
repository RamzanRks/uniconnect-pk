const asyncHandler = require('../utils/asyncHandler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ProjectPost = require('../models/ProjectPost');
const Application = require('../models/Application');
const User = require('../models/User');
const { emitToUser, notifyUser } = require('../utils/socket');

// @desc    Open a DM request (or get existing)
const openConversation = asyncHandler(async (req, res) => {
  const { recipientId, projectId } = req.body;
  if (!recipientId) { res.status(400); throw new Error('recipientId is required'); }
  if (String(recipientId) === String(req.user._id)) { res.status(400); throw new Error('Cannot message yourself'); }

  let autoAccept = false;
  if (projectId) {
    const p = await ProjectPost.findById(projectId);
    if (p) {
      const parts = [String(p.creator)];
      const accepted = await Application.find({ project: p._id, status: 'accepted' }).select('applicant');
      accepted.forEach((a) => parts.push(String(a.applicant)));
      if (parts.includes(String(req.user._id)) && parts.includes(String(recipientId))) autoAccept = true;
    }
  }

  let convo = await Conversation.findOne({
    isGroup: false,
    participants: { $all: [req.user._id, recipientId] },
    project: projectId || null,
  });

  if (!convo) {
    convo = await Conversation.create({
      participants: [req.user._id, recipientId],
      starter: req.user._id,
      project: projectId || null,
      status: autoAccept ? 'accepted' : 'pending',
    });
  }
  res.json(convo);
});

// @desc    My Inbox with tabs (primary/requests/archived) + search + per-user flags
const getMyConversations = asyncHandler(async (req, res) => {
  const { search, tab } = req.query;
  const me = req.user._id;
  const filter = { participants: me };

  if (tab === 'requests') { filter.status = 'pending'; filter.isGroup = false; }
  else if (tab === 'archived') { filter.archivedBy = me; }
  else { filter.archivedBy = { $ne: me }; filter.$or = [{ status: 'accepted' }, { isGroup: true }]; }

  const convos = await Conversation.find(filter)
    .populate('participants', 'firstName lastName username avatarUrl university')
    .populate('project', 'title');

  let result = convos;
  if (search && search.trim()) {
    const q = search.toLowerCase();
    result = convos.filter((c) => {
      if (c.isGroup) return (c.name || '').toLowerCase().includes(q);
      const other = c.participants.find((p) => p._id.toString() !== me.toString());
      return other?.firstName?.toLowerCase().includes(q) || other?.lastName?.toLowerCase().includes(q);
    });
  }

  const enriched = await Promise.all(result.map(async (c) => {
    const unread = await Message.countDocuments({ conversation: c._id, read: false, sender: { $ne: me } });
    const lastMessage = await Message.findOne({ conversation: c._id }).sort({ createdAt: -1 });
    return {
      ...c.toObject(),
      unread,
      lastMessage,
      pinned: c.pinnedBy.some((id) => id.toString() === me.toString()),
      muted: c.mutedBy.some((id) => id.toString() === me.toString()),
      archived: c.archivedBy.some((id) => id.toString() === me.toString()),
    };
  }));

  enriched.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  res.json(enriched);
});

// @desc    Single conversation meta (chat header)
const getConvoMeta = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id)
    .populate('participants', 'firstName lastName username avatarUrl university')
    .populate('project', 'title');
  if (!convo || !convo.participants.some((p) => p._id.toString() === req.user._id.toString())) {
    res.status(403); throw new Error('Not authorized');
  }
  res.json(convo);
});

// @desc    Accept a message request
const acceptRequest = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo || !convo.participants.some((p) => p.toString() === req.user._id.toString())) {
    res.status(403); throw new Error('Not authorized');
  }
  convo.status = 'accepted';
  await convo.save();
  res.json(convo);
});

// @desc    Get messages (marks read) + populate replyTo
const getMessages = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo || !convo.participants.some((p) => p.toString() === req.user._id.toString())) {
    res.status(403); throw new Error('Not authorized');
  }
  const messages = await Message.find({ conversation: convo._id })
    .sort({ createdAt: 1 })
    .populate('sender', 'firstName lastName avatarUrl')
    .populate({ path: 'replyTo', populate: { path: 'sender', select: 'firstName lastName' } });
  await Message.updateMany(
    { conversation: convo._id, sender: { $ne: req.user._id }, read: false },
    { read: true }
  );
  for (const pid of convo.participants) {
    if (pid.toString() !== req.user._id.toString()) {
      emitToUser(pid, 'messages_read', { conversation: convo._id.toString(), reader: req.user._id.toString() });
    }
  }
  res.json(messages);
});

// @desc    Send message (images, any file, voice notes, replies; DM limit; block check)
const sendMessage = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo || !convo.participants.some((p) => p.toString() === req.user._id.toString())) {
    res.status(403); throw new Error('Not authorized');
  }

  if (!convo.isGroup) {
    const otherId = convo.participants.find((p) => p.toString() !== req.user._id.toString());
    const [me, other] = await Promise.all([User.findById(req.user._id), User.findById(otherId)]);
    const iBlocked = (me.blockedUsers || []).some((id) => id.toString() === otherId.toString());
    const theyBlocked = (other.blockedUsers || []).some((id) => id.toString() === req.user._id.toString());
    if (iBlocked || theyBlocked) { res.status(403); throw new Error('Messaging is blocked between you and this user.'); }

    const isStarter = String(convo.starter) === String(req.user._id);
    if (convo.status === 'pending') {
      if (isStarter) {
        const sentCount = await Message.countDocuments({ conversation: convo._id, sender: req.user._id });
        if (sentCount >= 5) { res.status(403); throw new Error('You have reached the limit of 5 message requests. Wait for them to accept or reply.'); }
        convo.requestCount = sentCount + 1;
      } else {
        convo.status = 'accepted';
      }
    }
  }

  let imageUrl = null, fileUrl = null, fileName = null, audioUrl = null;
  if (req.file) {
    const url = `/uploads/${req.file.filename}`;
    const mime = req.file.mimetype || '';
    if (mime.startsWith('image/')) imageUrl = url;
    else if (mime.startsWith('audio/')) audioUrl = url;
    else { fileUrl = url; fileName = req.body.fileName || req.file.originalname; }
  }
  if (!req.body.text && !imageUrl && !fileUrl && !audioUrl) { res.status(400); throw new Error('Message must have text, image, file or audio.'); }

  const msg = await Message.create({
    conversation: convo._id,
    sender: req.user._id,
    text: req.body.text || '',
    imageUrl, fileUrl, fileName, audioUrl,
    replyTo: req.body.replyTo || null,
  });

  convo.lastMessageAt = new Date();
  await convo.save();

  const populated = await Message.findById(msg._id)
    .populate('sender', 'firstName lastName avatarUrl')
    .populate({ path: 'replyTo', populate: { path: 'sender', select: 'firstName lastName' } });

  for (const pid of convo.participants) {
    if (pid.toString() !== req.user._id.toString()) {
      emitToUser(pid, 'new_message', populated);
      const preview = req.body.text ? req.body.text.slice(0, 40) : imageUrl ? '📷 Photo' : audioUrl ? '🎤 Voice note' : '📄 File';
      await notifyUser(pid, 'message', `${req.user.firstName} ${req.user.lastName}: ${preview}`, `/inbox?c=${convo._id}`);
    }
  }
  res.status(201).json(populated);
});

// @desc    Delete for everyone (sender only)
const deleteMessage = asyncHandler(async (req, res) => {
  const msg = await Message.findById(req.params.id);
  if (!msg) { res.status(404); throw new Error('Message not found'); }
  if (msg.sender.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Only the sender can delete.'); }
  msg.deleted = true;
  msg.text = '';
  await msg.save();
  res.json(msg);
});

// @desc    Forward a message to another conversation
const forwardMessage = asyncHandler(async (req, res) => {
  const { messageId, conversationId } = req.body;
  const src = await Message.findById(messageId);
  if (!src) { res.status(404); throw new Error('Message not found'); }
  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.participants.some((p) => p.toString() === req.user._id.toString())) { res.status(403); throw new Error('Not authorized'); }

  const msg = await Message.create({
    conversation: convo._id,
    sender: req.user._id,
    text: src.deleted ? '' : src.text,
    imageUrl: src.imageUrl, fileUrl: src.fileUrl, fileName: src.fileName, audioUrl: src.audioUrl,
    forwarded: true,
  });
  convo.lastMessageAt = new Date();
  await convo.save();
  const populated = await Message.findById(msg._id).populate('sender', 'firstName lastName avatarUrl');
  for (const pid of convo.participants) {
    if (pid.toString() !== req.user._id.toString()) emitToUser(pid, 'new_message', populated);
  }
  res.status(201).json(populated);
});

// @desc    Pin / mute / archive (per user)
const updateSettings = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const convo = await Conversation.findById(req.params.id);
  if (!convo || !convo.participants.some((p) => p.toString() === req.user._id.toString())) { res.status(403); throw new Error('Not authorized'); }
  const me = req.user._id;
  const toggle = (arr, on) => {
    const has = arr.some((id) => id.toString() === me.toString());
    if (on && !has) arr.push(me);
    if (!on && has) return arr.filter((id) => id.toString() !== me.toString());
    return arr;
  };
  if (action === 'pin') convo.pinnedBy = toggle(convo.pinnedBy, true);
  else if (action === 'unpin') convo.pinnedBy = toggle(convo.pinnedBy, false);
  else if (action === 'mute') convo.mutedBy = toggle(convo.mutedBy, true);
  else if (action === 'unmute') convo.mutedBy = toggle(convo.mutedBy, false);
  else if (action === 'archive') convo.archivedBy = toggle(convo.archivedBy, true);
  else if (action === 'unarchive') convo.archivedBy = toggle(convo.archivedBy, false);
  else { res.status(400); throw new Error('Invalid action'); }
  await convo.save();
  res.json(convo);
});

// @desc    Leave a group
const leaveGroup = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo || !convo.isGroup) { res.status(400); throw new Error('Not a group'); }
  if (String(convo.starter) === String(req.user._id)) { res.status(400); throw new Error('The creator cannot leave the group.'); }
  convo.participants = convo.participants.filter((p) => p.toString() !== req.user._id.toString());
  convo.admins = convo.admins.filter((a) => a.toString() !== req.user._id.toString());
  await convo.save();
  res.json({ message: 'You left the group.' });
});

// @desc    Update group name / description / photo (admins only)
const updateGroupInfo = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo || !convo.isGroup) { res.status(400); throw new Error('Not a group'); }
  if (!convo.admins.some((a) => a.toString() === req.user._id.toString())) { res.status(403); throw new Error('Only admins can edit group info.'); }
  if (req.body.name) convo.name = req.body.name;
  if (req.body.description !== undefined) convo.description = req.body.description;
  if (req.file) convo.groupPhoto = `/uploads/${req.file.filename}`;
  await convo.save();
  res.json(convo);
});

// @desc    Create a group
const createGroup = asyncHandler(async (req, res) => {
  const { name, memberIds } = req.body;
  if (!name || !Array.isArray(memberIds) || memberIds.length < 1) { res.status(400); throw new Error('Group needs a name and at least 1 member.'); }
  const convo = await Conversation.create({
    name, isGroup: true, status: 'accepted',
    participants: [req.user._id, ...memberIds],
    starter: req.user._id, admins: [req.user._id],
  });
  res.status(201).json(convo);
});

// @desc    Add members (admins only)
const addMembers = asyncHandler(async (req, res) => {
  const { memberIds } = req.body;
  const convo = await Conversation.findById(req.params.id);
  if (!convo || !convo.isGroup) { res.status(400); throw new Error('Not a group'); }
  if (!convo.admins.some((a) => a.toString() === req.user._id.toString())) { res.status(403); throw new Error('Only admins can add members.'); }
  for (const id of memberIds) {
    if (!convo.participants.some((p) => p.toString() === String(id))) convo.participants.push(id);
  }
  await convo.save();
  res.json(convo);
});

// @desc    Remove member (admins; creator untouchable)
const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const convo = await Conversation.findById(req.params.id);
  if (!convo || !convo.isGroup) { res.status(400); throw new Error('Not a group'); }
  if (String(userId) === String(convo.starter)) { res.status(400); throw new Error('The group creator cannot be removed.'); }
  if (!convo.admins.some((a) => a.toString() === req.user._id.toString())) { res.status(403); throw new Error('Only admins can remove members.'); }
  convo.participants = convo.participants.filter((p) => p.toString() !== String(userId));
  convo.admins = convo.admins.filter((a) => a.toString() !== String(userId));
  await convo.save();
  res.json(convo);
});

// @desc    Make admin (creator only)
const makeAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const convo = await Conversation.findById(req.params.id);
  if (!convo || !convo.isGroup) { res.status(400); throw new Error('Not a group'); }
  if (String(convo.starter) !== String(req.user._id)) { res.status(403); throw new Error('Only the creator can assign admins.'); }
  if (!convo.admins.some((a) => a.toString() === String(userId))) convo.admins.push(userId);
  await convo.save();
  res.json(convo);
});

module.exports = {
  openConversation, getMyConversations, getConvoMeta, acceptRequest, getMessages,
  sendMessage, deleteMessage, forwardMessage, updateSettings, leaveGroup, updateGroupInfo,
  createGroup, addMembers, removeMember, makeAdmin,
};