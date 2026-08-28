const asyncHandler = require('../utils/asyncHandler');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const ProjectPost = require('../models/ProjectPost');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Application = require('../models/Application');
const Rating = require('../models/Rating');
const generateToken = require('../utils/generateToken');
const { sendMail, isConfigured } = require('../utils/mailer');

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

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

// Helper: create + email a 6-digit code (console fallback in dev)
const issueCode = async (user, subject, text) => {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  user.verificationCode = code;
  user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  let dev = true;
  try {
    const r = await sendMail({ to: user.email, subject, text: `${text} Code: ${code} (expires in 15 min)` });
    dev = !!r.dev;
  } catch (e) { dev = true; }
  console.log(`🔑 [CODE] ${user.email}: ${code}`); // codes live in the backend terminal only
  return { code, dev };
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
    const { code, dev } = await issueCode(user, 'Verify your UniConnect PK email', 'Welcome! Your verification code:');
    res.status(201).json({
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      university: user.university,
      role: user.role,
      verificationStatus: user.verificationStatus,
      emailVerified: false,
      ...(dev ? { devCode: code } : {}),
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Verify email with 6-digit code
// @route   POST /api/auth/verify-email
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email });
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.emailVerified) return res.json({ message: 'Already verified.' });
  if (!user.verificationCode || user.verificationCode !== String(code) || !user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
    res.status(400);
    throw new Error('Invalid or expired code.');
  }
  user.emailVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();
  sendMail({ to: user.email, subject: 'Welcome to UniConnect PK 🎓', text: `Welcome ${user.firstName}! Your email is now verified.` }).catch(() => {});
  res.json({ message: 'Email verified. Welcome aboard!' });
});

// @desc    Resend verification code
// @route   POST /api/auth/resend-code
const resendCode = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) { res.status(404); throw new Error('User not found'); }
  const { code, dev } = await issueCode(user, 'Your UniConnect PK verification code', 'Your new verification code:');
  res.json({ message: 'Code sent.', ...(dev ? { devCode: code } : {}) });
});

// @desc    Google OAuth login (ID token from frontend)
// @route   POST /api/auth/google
const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!googleClient) { res.status(501); throw new Error('Google login not configured. Add GOOGLE_CLIENT_ID.'); }

  const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  const email = String(payload.email).toLowerCase();

  if (process.env.TEST_MODE !== 'true' && !/\.edu(\.pk)?$/i.test(email)) {
    res.status(400);
    throw new Error('Only university .edu emails can join UniConnect PK.');
  }

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      firstName: payload.given_name || 'Google',
      lastName: payload.family_name || 'Student',
      email,
      password: `${Math.random().toString(36).slice(-14)}A1!`,
      university: 'Not set',
      major: 'Not set',
      avatarUrl: payload.picture || null,
      googleId: payload.sub,
      emailVerified: true,
    });
  } else {
    user.googleId = payload.sub;
    user.emailVerified = true;
    if (payload.picture && !user.avatarUrl) user.avatarUrl = payload.picture;
    await user.save();
  }

  if (user.isBanned) {
    res.status(403);
    throw new Error('Your account has been suspended for violating community guidelines.');
  }

  res.json({ token: generateToken(user._id, user.role) });
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
      emailVerified: user.emailVerified,
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

  if (university && university !== 'Not set') user.university = university;
  if (major && major !== 'Not set') user.major = major;
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

// @desc    Change password (logged in)
// @route   PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect.');
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password changed successfully.' });
});

// @desc    Forgot password → send reset code
// @route   POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) { res.status(404); throw new Error('No account found with this email.'); }
  const { code, dev } = await issueCode(user, 'UniConnect PK password reset', 'Your password reset code:');
  res.json({ message: 'Reset code sent.', ...(dev ? { devCode: code } : {}) });
});

// @desc    Reset password with code
// @route   POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (!user.verificationCode || user.verificationCode !== String(code) || !user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
    res.status(400);
    throw new Error('Invalid or expired code.');
  }
  user.password = newPassword;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();
  res.json({ message: 'Password reset successfully. You can now login.' });
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

// @desc    Validate a code (with expiry) BEFORE allowing password reset
// @route   POST /api/auth/check-code
const checkCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email });
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (!user.verificationCode || user.verificationCode !== String(code)) { res.status(400); throw new Error('Invalid code.'); }
  if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) { res.status(400); throw new Error('Code expired. Please resend a new code.'); }
  res.json({ valid: true });
});

// @desc    Mandatory first-time setup for Google-created accounts
// @route   POST /api/auth/complete-profile
const completeProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.university !== 'Not set') { res.status(400); throw new Error('Profile already completed.'); }
  const { firstName, lastName, username, university, major, skills } = req.body;
  if (!firstName || !lastName || !university || !major) { res.status(400); throw new Error('All fields are required.'); }
  user.firstName = firstName;
  user.lastName = lastName;
  user.university = university;
  user.major = major;
  if (skills) user.skills = Array.isArray(skills) ? skills : String(skills).split(',').map((s) => s.trim()).filter(Boolean);
  if (username) user.username = await cleanUsername(username, user._id);
  await user.save();
  res.json(user);
});

module.exports = {
  registerUser, loginUser, getUserProfile, updateProfile,
  requestNameChange, setAvatar, removeAvatar, requestVerification, exportMyData,
  verifyEmail, resendCode, googleLogin, changePassword, forgotPassword, resetPassword,checkCode,completeProfile,
};