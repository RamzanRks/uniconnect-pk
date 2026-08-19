const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, university, major, skills } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with this university email already exists');
  }

  const user = await User.create({ firstName, lastName, email, password, university, major, skills });

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
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update own profile (skills, bio, etc.)
// @route   PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { university, major, skills, bio } = req.body;

  if (university) user.university = university;
  if (major) user.major = major;
  if (bio !== undefined) user.bio = bio;
  if (skills !== undefined) {
    user.skills = Array.isArray(skills)
      ? skills
      : String(skills).split(',').map((s) => s.trim()).filter(Boolean);
  }

  await user.save();
  res.json(user);
});

// @desc    Request verified badge (upload university ID card)
// @route   POST /api/auth/verify
const requestVerification = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image of your university ID card');
  }

  const user = await User.findById(req.user._id);
  user.idCardUrl = `/uploads/${req.file.filename}`;
  user.verificationStatus = 'pending';
  await user.save();

  res.json({
    message: 'ID submitted. An admin will review it shortly.',
    verificationStatus: user.verificationStatus,
    idCardUrl: user.idCardUrl,
  });
});

module.exports = { registerUser, loginUser, getUserProfile, updateProfile, requestVerification };