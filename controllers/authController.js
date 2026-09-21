const asyncHandler = require('../utils/asyncHandler');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const User = require('../models/User');
const ProjectPost = require('../models/ProjectPost');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Application = require('../models/Application');
const Rating = require('../models/Rating');
const generateToken = require('../utils/generateToken');
const { sendMail, isConfigured } = require('../utils/mailer');

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

const deviceFingerprint = (req) => crypto.createHash('sha1').update(String(req.headers['user-agent'] || '') + String(req.ip || '')).digest('hex');

const createSession = (user, req) => {
  const sid = crypto.randomUUID();
  user.sessions = [...(user.sessions || []).slice(-4), { sid, device: String(req.headers['user-agent'] || 'Unknown').slice(0, 80), ip: String(req.ip || ''), createdAt: new Date() }];
  return sid;
};

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

  // 🔒 SECURITY: Only log codes in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔑 [CODE] ${user.email}: ${code}`);
  }

  return { code, dev };
};

// 🎓 FULL HEC RECOGNIZED UNIVERSITIES LIST
const allowedUniversities = [
  "National University of Sciences and Technology (NUST)", "FAST-NUCES", "Lahore University of Management Sciences (LUMS)", "COMSATS University Islamabad (CUI)", "University of Engineering and Technology (UET)", "Air University", "GIKI (Ghulam Ishaq Khan Institute)", "University of the Punjab", "University of Karachi", "IBA Karachi", "Bahria University", "HITEC University", "Usman Institute of Technology (UIT)", "Sir Syed University of Engineering and Technology (SSUET)", "Riphah International University", "Capital University of Science & Technology", "Quaid-i-Azam University", "Pakistan Institute of Engineering and Applied Sciences (PIEAS)", "National Defence University", "Allama Iqbal Open University", "International Islamic University, Islamabad", "National University of Modern Languages (NUML)", "Sir Syed CASE Institute of Technology", "Federal Urdu University of Arts, Science and Technology", "Institute of Space Technology", "Foundation University, Islamabad", "Virtual University of Pakistan", "Shifa Tameer-e-Millat University", "Shaheed Zulfiqar Ali Bhutto Medical University", "Muslim Youth University", "National University of Technology (NUTECH)", "Pakistan Institute of Development Economics (PIDE)", "National Skills University", "IBADAT International University Islamabad", "University of Balochistan", "Bolan University of Medical & Health Sciences", "Al-Hamd Islamic University", "Balochistan University of Information Technology, Engineering and Management Sciences (BUITEMS)", "Sardar Bahadur Khan Women's University", "University of Turbat", "University of Gwadar", "University of Makran", "Balochistan University of Engineering and Technology", "Lasbela University of Agriculture, Water and Marine Sciences", "University of Loralai", "Mir Chakar Khan Rind University", "Islamia College University", "University of Peshawar", "University of Agriculture, Peshawar", "CECOS University of IT and Emerging Sciences", "University of Engineering and Technology, Peshawar", "Gandhara University", "Institute of Management Sciences, Peshawar", "IQRA National University", "Qurtuba University", "Sarhad University of Science and IT", "City University of Science and IT, Peshawar", "Shaheed Benazir Bhutto Women University", "Khyber Medical University", "Abasyn University", "University of Agriculture, Dera Ismail Khan", "Gomal University", "Abbottabad University of Science and Technology", "Kohat University of Science and Technology", "Women University Swabi", "University of Swabi", "University of Swat", "University of Engineering & Applied Sciences, Swat", "University of Veterinary & Animal Sciences KP", "University of Haripur", "Pak-Austria Fachhochschule Institute of Applied Sciences and Technology", "University of Engineering and Technology, Mardan", "Women University Mardan", "Abdul Wali Khan University Mardan", "Hazara University", "Northern University, Nowshera", "University of Science and Technology Bannu", "Shaheed Benazir Bhutto University, Sheringal", "University of Malakand", "University of Buner", "University of Technology, Nowshera", "FATA University", "University of Chitral", "University of Lakki Marwat", "Khushal Khan Khattak University", "Bacha Khan University", "University of Dir", "University of Shangla", "King Edward Medical University", "Forman Christian College University", "National College of Arts", "University of Veterinary and Animal Sciences (UVAS)", "Punjab Tianjin University of Technology", "Kinnaird College for Women University", "Government College University, Lahore (GCU)", "Lahore College for Women University", "Fatima Jinnah Medical University", "Institute of Management Sciences, Lahore", "University of Management and Technology, Lahore (UMT)", "National College of Business Administration and Economics (NCBA&E)", "University of Central Punjab (UCP)", "University of Health Sciences, Lahore", "University of Education, Lahore", "University of Lahore (UOL)", "Beaconhouse National University", "University of South Asia", "Superior University", "Minhaj University, Lahore", "Pakistan Institute of Fashion and Design (PIFD)", "Information Technology University of the Punjab (ITU)", "Lahore School of Economics", "University of Home Economics Lahore", "NUR International University", "Qarshi University", "Hajvery University", "Institute for Art and Culture", "Green International University", "Lahore Institute of Science and Technology", "Rashid Latif Khan University", "Lahore Garrison University", "Ali Institute of Education", "Imperial College of Business Studies", "Lahore Leads University", "Lahore University of Biological and Applied Sciences", "University of Child Health Sciences", "National University of Pakistan", "Pir Mehr Ali Shah Arid Agriculture University", "Fatima Jinnah Women University", "Rawalpindi Medical University", "National University of Medical Sciences", "Rawalpindi Women University", "Government Viqar-un-Nisa Women University", "University of Agriculture, Faisalabad", "Government College University, Faisalabad", "National Textile University", "Faisalabad Medical University", "The University of Faisalabad", "Government College Women University, Faisalabad", "Government Sadiq College Women University", "The Islamia University of Bahawalpur", "Cholistan University of Veterinary and Animal Sciences", "University of Wah", "University of Sargodha", "Al-Karam International Institute", "GIFT University", "International Institute of Science, Arts and Technology", "The University of Chenab", "University of Gujrat", "Government College Women University, Sialkot", "University of Sialkot", "Grand Asian University Sialkot", "NFC Institute of Engineering and Technology", "Bahauddin Zakariya University", "Women University Multan", "University of Southern Punjab", "Muhammad Nawaz Sharif University of Agriculture", "Muhammad Nawaz Sharif University of Engineering and Technology", "Multan University of Science & Technology", "Times Institute", "Nishtar Medical University", "Emerson University, Multan", "Khawaja Fareed University of Engineering and Information Technology", "Punjab University of Technology, Rasul", "University of Sahiwal", "University of Okara", "University of Jhang", "Ghazi University", "Mir Chakar Khan Rind University of Technology", "Ghazi National Institute of Engineering & Sciences", "University of Narowal", "Al-Qadir University", "Baba Guru Nanak University", "University of Chakwal", "University of Mianwali", "Namal University", "Thal University", "Kohsar University Murree", "Institute of Management & Applied Sciences", "University of Layyah", "KASB Institute of Technology", "Sindh Madressatul Islam University", "NED University of Engineering and Technology", "Dow University of Health Sciences", "Dawood University of Engineering and Technology", "Pakistan Naval Academy", "Indus Valley School of Art and Architecture", "Baqai Medical University", "Hamdard University", "Textile Institute of Pakistan", "Institute of Business Management (IoBM)", "Shaheed Zulfiqar Ali Bhutto Institute of Science and Technology (SZABIST)", "Karachi Institute of Economics and Technology (KIET)", "Greenwich University, Karachi", "Jinnah University for Women", "Iqra University", "Dadabhoy Institute of Higher Education", "Ilma University", "Preston University", "Indus University", "Aga Khan University", "Muhammad Ali Jinnah University", "Sindh Institute of Medical Sciences", "Karachi School for Business and Leadership", "Habib University", "Benazir Bhutto Shaheed University, Lyari", "Jinnah Sindh Medical University", "Shaheed Zulfiqar Ali Bhutto University of Law", "DHA Suffa University", "Nazeer Hussain University", "Newports Institute of Communications and Economics", "Shaheed Benazir Bhutto City University", "Shaheed Benazir Bhutto Dewan University", "Qalandar Shahbaz University of Modern Sciences", "Ziauddin University", "Salim Habib University", "Sohail University", "Millennium Institute of Technology and Entrepreneurship", "City University of Health Sciences", "Karachi Institute of Technology & Entrepreneurship", "Emaan Institute of Management and Sciences", "Malir University of Science and Technology", "Karachi Institute of Power Engineering (KINPOE)", "University of Art and Culture, Jamshoro", "Shaheed Allah Bux Soomro University of Art, Design and Heritages", "Liaquat University of Medical and Health Sciences", "University of Sindh", "Mehran University of Engineering and Technology", "Shaheed Benazir Bhutto University, Benazirabad", "Quaid-e-Awam University of Engineering, Science and Technology", "Peoples University of Medical and Health Sciences for Women", "Shaheed Benazir Bhutto University of Veterinary and Animal Sciences", "Isra University", "University of EAST", "Hyderabad Institute for Technical & Management Sciences", "Government College University Hyderabad", "Sukkur IBA University", "Aror University of Art, Architecture, Design & Heritage", "Begum Nusrat Bhutto Women University", "Shah Abdul Latif University", "Pir Abdul Qadir Shah Jeelani Institute of Medical Sciences", "Benazir Bhutto Shaheed University of Technology and Skill Development", "Shaheed Mohtarma Benazir Bhutto Medical University", "University of Larkano", "Sindh Agriculture University", "University of Sufism and Modern Sciences", "Shaikh Ayaz University", "University of Mirpurkhas", "Mirpur University of Science and Technology", "University of Azad Jammu and Kashmir", "University of Poonch", "Al-Khair University", "Mohi-ud-Din Islamic University", "Women University of Azad Jammu and Kashmir, Bagh", "University of Kotli", "Karakoram International University", "Baltistan University"
];

// ---- Robust university whitelist matching ----
const normSoft = (s) => String(s || '').trim().toLowerCase();
const normHard = (s) => normSoft(s).replace(/[^a-z0-9]/g, '');

const universityLookup = new Map(allowedUniversities.map((u) => [normSoft(u), u.trim()]));
const universityLookupHard = new Map(allowedUniversities.map((u) => [normHard(u), u.trim()]));

const canonicalUniversityName = (input) => {
  const soft = normSoft(input);
  if (!soft) return null;
  return universityLookup.get(soft) || universityLookupHard.get(normHard(input)) || null;
};

// degreeLevel must match the User model enum
const DEGREE_LEVELS = ['BS', 'MS', 'PhD', 'BBA', 'MBA', 'LLB', 'LLM', 'MBBS', 'FCPS'];
const cleanDegreeLevel = (v) => {
  const s = String(v || '').trim();
  return DEGREE_LEVELS.includes(s) ? s : '';
};
// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, university, campus, major, degreeLevel, skills, username, honeypot } = req.body;

  // 🤖 HONEYPOT TRAP (Bot Protection)
  if (honeypot) {
    return res.status(201).json({ message: 'User registered successfully', _id: 'fake-id', dev: true });
  }

  // 🛡️ BACKEND VALIDATION
  const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400);
    throw new Error('Password must be 8+ characters with an uppercase letter, number, and symbol.');
  }

  const canonicalUniversity = canonicalUniversityName(university);
  if (!canonicalUniversity) {
    res.status(400);
    throw new Error('Please select a valid university from the provided list.');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with this university email already exists');
  }

  const uname = await cleanUsername(username);

  const user = await User.create({
    firstName, lastName, email, password,
    university: canonicalUniversity,
    campus: String(campus || '').trim(),
    major,
    degreeLevel: cleanDegreeLevel(degreeLevel),
    skills, username: uname,
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
  if (process.env.TEST_MODE !== 'true' && !/.edu(.pk)?$/i.test(email)) {
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
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

  if (!user || !(await user.matchPassword(password))) {
    // Increment failed attempts if user exists
    if (user) {
      await user.incLoginAttempts();

      // Check if now locked
      if (user.loginAttempts + 1 >= 5) {
        res.status(423); // Locked
        throw new Error('Account locked for 15 minutes due to too many failed attempts.');
      }

      const remaining = 5 - (user.loginAttempts + 1);
      res.status(401);
      throw new Error(`Invalid email or password. ${remaining} attempt(s) remaining before lockout.`);
    }

    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check if account is locked
  if (user.isLocked) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    res.status(423);
    throw new Error(`Account is locked. Try again in ${minutesLeft} minute(s).`);
  }

  if (user.isBanned) {
    res.status(403);
    throw new Error('Your account has been suspended for violating community guidelines.');
  }

  if (!user.emailVerified) {
    return res.json({
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      university: user.university,
      role: user.role,
      verificationStatus: user.verificationStatus,
      emailVerified: false,
      token: generateToken(user._id, user.role),
    });
  }

  // 2FA: check if this device is known
  const fp = deviceFingerprint(req);
  const known = (user.knownDevices || []).some((d) => d.fp === fp);
  if (user.twoFAEnabled !== false && !known) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    user.twoFACode = code;
    user.twoFAExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.pendingDevice = { fp, label: String(req.headers['user-agent'] || 'New device').slice(0, 80), ip: String(req.ip || '') };
    await user.save();

    // 🔒 SECURITY: Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔐 [2FA] ${user.email}: ${code}`);
    }

    try {
      await sendMail({ to: user.email, subject: '🔐 UniConnect PK Login Code', text: `Your new-device login code: ${code}. Expires in 15 min.` });
    } catch (e) { /* code in terminal in dev */ }

    return res.json({ twoFA: true, email: user.email });
  }

  // Successful login: reset attempts
  await user.resetLoginAttempts();

  // Known device or 2FA disabled → start session
  const sid = createSession(user, req);
  await user.save();

  res.json({
    _id: user._id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    university: user.university,
    role: user.role,
    verificationStatus: user.verificationStatus,
    emailVerified: true,
    token: generateToken(user._id, user.role, sid),
  });
});

// @desc    Verify 2FA code → trust device + start session
// @route   POST /api/auth/verify-2fa
const verifyTwoFA = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.twoFACode) { res.status(400); throw new Error('No pending verification.'); }
  if (user.twoFACode !== String(code) || !user.twoFAExpires || user.twoFAExpires < new Date()) {
    res.status(400);
    throw new Error('Invalid or expired code.');
  }
  const pd = user.pendingDevice || {};
  if (pd.fp) {
    user.knownDevices = [...(user.knownDevices || []).filter((d) => d.fp !== pd.fp).slice(-4), { fp: pd.fp, label: pd.label || 'Device', lastUsed: new Date() }];
  }
  user.twoFACode = undefined;
  user.twoFAExpires = undefined;
  user.pendingDevice = undefined;
  const sid = createSession(user, req);
  await user.save();
  res.json({
    _id: user._id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    university: user.university,
    role: user.role,
    verificationStatus: user.verificationStatus,
    emailVerified: true,
    token: generateToken(user._id, user.role, sid),
  });
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
  const { university, campus, degreeLevel, major, skills, bio, location, links, education, username, accentColor, accent2, portfolioTheme, superBio, headline, customLinks, openToWork, portfolioSections, portfolioFont, portfolioPattern, portfolioFx, graduated, graduationYear, company, openToRefer, mentor, onboarded } = req.body;
  
if (university && university !== 'Not set') {
  const canonical = universityLookup.get(String(university).trim().toLowerCase());
  if (!canonical) {
    res.status(400);
    throw new Error('Invalid university selected.');
  }
  user.university = canonical;
}
  if (campus !== undefined) user.campus = String(campus || '').trim();
  if (degreeLevel !== undefined) user.degreeLevel = cleanDegreeLevel(degreeLevel);
  if (major && major !== 'Not set') user.major = major;
  if (bio !== undefined) user.bio = bio;
  if (location !== undefined) user.location = location;
  if (skills !== undefined) {
    user.skills = (Array.isArray(skills) ? skills : String(skills).split(','))
      .map((s) => String(s).trim()).filter(Boolean);
  }
  if (links !== undefined) user.links = { ...user.links, ...links };
  if (education !== undefined && Array.isArray(education)) user.education = education;
  if (username !== undefined) user.username = await cleanUsername(username, user._id);
  if (accentColor !== undefined) user.accentColor = accentColor;
  if (accent2 !== undefined) user.accent2 = accent2;
  if (portfolioFont !== undefined) user.portfolioFont = portfolioFont;
  if (portfolioPattern !== undefined) user.portfolioPattern = portfolioPattern;
  if (portfolioFx !== undefined) user.portfolioFx = { ...user.portfolioFx, ...portfolioFx };
  if (graduated !== undefined) user.graduated = !!graduated;
  if (graduationYear !== undefined) user.graduationYear = graduationYear ? Number(graduationYear) : undefined;
  if (company !== undefined) user.company = company;
  if (openToRefer !== undefined) user.openToRefer = !!openToRefer;
  if (mentor !== undefined) user.mentor = !!mentor;
  if (portfolioTheme !== undefined) user.portfolioTheme = portfolioTheme;
  if (superBio !== undefined) user.superBio = superBio;
  if (headline !== undefined) user.headline = headline;
  if (customLinks !== undefined && Array.isArray(customLinks)) user.customLinks = customLinks;
  if (openToWork !== undefined) user.openToWork = !!openToWork;
  if (onboarded !== undefined) {
    const wasOnboarded = !!user.onboarded;
    user.onboarded = !!onboarded;
    if (!wasOnboarded && user.onboarded) {
      user.points = (user.points || 0) + 5;
      console.log(`🎉 Onboarding complete for ${user.email}: +5 points`);
    }
  }
  if (portfolioSections !== undefined) user.portfolioSections = { ...user.portfolioSections, ...portfolioSections };
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
  const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    res.status(400);
    throw new Error('Password must be 8+ characters with an uppercase letter, number, and symbol.');
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
  const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    res.status(400);
    throw new Error('Password must be 8+ characters with an uppercase letter, number, and symbol.');
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
  const { firstName, lastName, username, university, campus, degreeLevel, major, skills } = req.body;
  if (!firstName || !lastName || !university || !major) { res.status(400); throw new Error('All fields are required.'); }
  
  const canonicalUniversity = canonicalUniversityName(university);
  if (!canonicalUniversity) {
    res.status(400);
    throw new Error('Invalid university selected.');
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.university = canonicalUniversity;
  user.campus = String(campus || '').trim();
  user.degreeLevel = cleanDegreeLevel(degreeLevel);
  user.major = major;
  if (skills) user.skills = Array.isArray(skills) ? skills : String(skills).split(',').map((s) => s.trim()).filter(Boolean);
  if (username) user.username = await cleanUsername(username, user._id);
  await user.save();
  res.json(user);
});

// @desc    Set profile banner (upload)
// @route   POST /api/auth/banner
const setBanner = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('Please upload a banner image'); }
  const user = await User.findById(req.user._id);
  user.bannerUrl = req.file.path && req.file.path.startsWith('http') ? req.file.path : `/uploads/${req.file.filename}`;
  await user.save();
  res.json({ bannerUrl: user.bannerUrl });
});

// @desc    Get current user's sessions
// @route   GET /api/auth/sessions
const getSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ sessions: user.sessions || [], twoFAEnabled: user.twoFAEnabled !== false });
});

// @desc    Logout all other devices (keep current session)
// @route   POST /api/auth/logout-others
const logoutOthers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const currentSid = req.currentSid;
  user.sessions = (user.sessions || []).filter((s) => s.sid === currentSid);
  user.knownDevices = [];
  await user.save();
  res.json({ message: 'All other devices logged out and trusted devices cleared.' });
});

// @desc    Logout a specific session by its ID
// @route   POST /api/auth/logout-session
const logoutSession = asyncHandler(async (req, res) => {
  const { sid } = req.body;
  if (!sid) { res.status(400); throw new Error('Session ID required'); }
  const user = await User.findById(req.user._id);
  const before = (user.sessions || []).length;
  user.sessions = (user.sessions || []).filter((s) => s.sid !== sid);
  if (before === user.sessions.length) { res.status(404); throw new Error('Session not found'); }
  await user.save();
  res.json({ message: 'Session logged out.', remaining: user.sessions.length });
});

// @desc    Enable/disable 2FA
// @route   PUT /api/auth/2fa
const setTwoFA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.twoFAEnabled = !!req.body.enabled;
  await user.save();
  res.json({ twoFAEnabled: user.twoFAEnabled });
});

// @desc    Notification preferences + sound + mute-all
const updateNotifPrefs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { prefs, soundEnabled, muteAll } = req.body;
  if (prefs) user.notifPrefs = { ...user.notifPrefs, ...prefs };
  if (soundEnabled !== undefined) user.soundEnabled = !!soundEnabled;
  if (muteAll === true) user.muteAllUntil = new Date(Date.now() + 60 * 60 * 1000);
  if (muteAll === false) user.muteAllUntil = undefined;
  await user.save();
  res.json({ notifPrefs: user.notifPrefs, soundEnabled: user.soundEnabled, muteAllUntil: user.muteAllUntil });
});

module.exports = {
  registerUser, loginUser, verifyTwoFA, getUserProfile, updateProfile,
  requestNameChange, setAvatar, removeAvatar, requestVerification, exportMyData,
  verifyEmail, resendCode, googleLogin, changePassword, forgotPassword, resetPassword,
  checkCode, completeProfile, setBanner,
  getSessions, logoutOthers, setTwoFA, logoutSession, updateNotifPrefs,
};