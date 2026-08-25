const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const ProjectPost = require('../models/ProjectPost');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Application = require('../models/Application');
const Rating = require('../models/Rating');
const generateToken = require('../utils/generateToken');

const cleanUsername = async (username, excludeId = null) => {
  if (username === undefined || username === null || String(username).trim() === '') return undefined;
  const uname = String(username).toLowerCase().trim();
  const taken = await User.findOne({ username: uname, _id: { $ne: excludeId } });
  if (taken) {
    const err = new Error('Username already taken');
    err.statusCode = 400;
    throw err;
  }
  return uname;
};

const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, university, major, skills, username } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with this university email already exists');
  }

  const uname = await cleanUsername(username);

  const user = await User.create({
    firstName, lastName, email, password, university, major, skills, username: uname,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      university: user.university,
      role: user.role,
      verificationStatus: user.verificationStatus,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    if (user.isBanned) {
      res.status(403);
      throw new Error('Your account has been suspended for violating community guidelines.');
    }
    res.json({
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      university: user.university,
      role: user.role,
      verificationStatus: user.verificationStatus,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) res.json(user);
  else { res.status(404); throw new Error('User not found'); }
});

// @desc    Update editable profile fields (names are LOCKED)
// @route   PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { university, major, skills, bio, location, links, education, username } = req.body;

  if (university) user.university = university;
  if (major) user.major = major;
  if (bio !== undefined) user.bio = bio;
  if (location !== undefined) user.location = location;
  if (skills !== undefined) {
    user.skills = Array.isArray(skills) ? skills : String(skills).split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (links !== undefined) user.links = { ...user.links, ...links };
  if (education !== undefined && Array.isArray(education)) user.education = education;
  if (username !== undefined) user.username = await cleanUsername(username, user._id);

  await user.save();
  res.json(user);
});

// @desc    Request a legal name change (admin must approve)
// @route   POST /api/auth/name-change
const requestNameChange = asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body;
  if (!firstName || !lastName) { res.status(400); throw new Error('Both names are required'); }
  const user = await User.findById(req.user._id);
  user.nameChangeRequest = { firstName, lastName, requestedAt: new Date() };
  await user.save();
  res.json({ message: 'Name change requested. Awaiting admin approval.' });
});

// @desc    Set avatar (upload)
// @route   POST /api/auth/avatar
const setAvatar = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('Please upload an image'); }
  const user = await User.findById(req.user._id);
  user.avatarUrl = req.file.path && req.file.path.startsWith('http') ? req.file.path : `/uploads/${req.file.filename}`;
  await user.save();
  res.json({ avatarUrl: user.avatarUrl });
});

// @desc    Remove avatar
// @route   DELETE /api/auth/avatar
const removeAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.avatarUrl = undefined;
  await user.save();
  res.json({ message: 'Avatar removed.' });
});

// @desc    Request verified badge (upload university ID card)
// @route   POST /api/auth/verify
const requestVerification = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('Please upload an image of your university ID card'); }
  const user = await User.findById(req.user._id);
  user.idCardUrl = req.file.path && req.file.path.startsWith('http') ? req.file.path : `/uploads/${req.file.filename}`;
  user.verificationStatus = 'pending';
  await user.save();
  res.json({
    message: 'ID submitted. An admin will review it shortly.',
    verificationStatus: user.verificationStatus,
    idCardUrl: user.idCardUrl,
  });
});

// @desc    GDPR-style export of ALL my data
// @route   GET /api/auth/export
const exportMyData = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  const [projects, questions, answers, applications, ratings] = await Promise.all([
    ProjectPost.find({ creator: user._id }),
    Question.find({ author: user._id }),
    Answer.find({ author: user._id }),
    Application.find({ applicant: user._id }),
    Rating.find({ rater: user._id }),
  ]);
  res.json({ user, projects, questions, answers, applications, ratings, exportedAt: new Date() });
});

module.exports = {
  registerUser, loginUser, getUserProfile, updateProfile,
  requestNameChange, setAvatar, removeAvatar, requestVerification, exportMyData,
};