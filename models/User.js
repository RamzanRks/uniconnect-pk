const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },

    // LOCKED: names can only change via admin-approved request
    nameChangeRequest: {
      firstName: String,
      lastName: String,
      requestedAt: Date,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username max 20 characters'],
      match: [/^[a-z0-9_.]+$/, 'Only letters, numbers, underscore and dot allowed'],
    },

    // STRICT VALIDATION: Only allows .edu or .edu.pk emails
    email: {
      type: String,
      required: [true, 'University email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => (process.env.TEST_MODE === 'true' ? true : /\.edu(\.pk)?$/i.test(v)),
        message: 'Please use a valid university .edu or .edu.pk email address',
      },
    },

    password: { type: String, required: true, minlength: [8, 'Password must be at least 8 characters'], select: false },
    university: { type: String, required: [true, 'University name is required'], trim: true },
    major: { type: String, required: true, trim: true },
    skills: [{ type: String, trim: true }],
    bio: { type: String, maxlength: 300, default: '' },
    location: { type: String, default: '' },

        headline: { type: String, maxlength: 120, default: '' },
    superBio: { type: String, maxlength: 2000, default: '' },
    bannerUrl: { type: String, default: null },
    accentColor: { type: String, default: '#2563eb' },
    accent2: { type: String, default: '#a855f7' },

        portfolioFont: { type: String, enum: ['sans', 'serif', 'mono'], default: 'sans' },
    portfolioPattern: { type: String, enum: ['none', 'dots', 'grid'], default: 'none' },
         onboarded: { type: Boolean, default: false },
    graduated: { type: Boolean, default: false },
    graduationYear: { type: Number },
    company: { type: String, default: '' },
    openToRefer: { type: Boolean, default: false },
    mentor: { type: Boolean, default: false },
    soundEnabled: { type: Boolean, default: true },
    muteAllUntil: { type: Date },
    notifPrefs: {
      messages: { type: Boolean, default: true },
      reactions: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      applications: { type: Boolean, default: true },
      system: { type: Boolean, default: true },
      emails: { type: Boolean, default: true },
    },
    coachCache: { tips: [String], score: Number, at: Date, askAt: Date },
    portfolioFx: {
      typewriter: { type: Boolean, default: true },
      scrollReveal: { type: Boolean, default: true },
      tilt: { type: Boolean, default: true },
      particles: { type: Boolean, default: true },
      counters: { type: Boolean, default: true },
      gradientBorders: { type: Boolean, default: true },
      glassNav: { type: Boolean, default: true },
      avatarRing: { type: Boolean, default: true },
      testimonials: { type: Boolean, default: true },
      qr: { type: Boolean, default: true },
      spotlight: { type: Boolean, default: true },
      magnetic: { type: Boolean, default: true },
      skillBars: { type: Boolean, default: true },
    },
    portfolioTheme: { type: String, enum: ['modern', 'dark', 'glass', 'gradient'], default: 'modern' },
    customLinks: [{ label: { type: String, default: '' }, url: { type: String, default: '' } }],
        openToWork: { type: Boolean, default: false },

            viewCount: { type: Number, default: 0 },
    viewLog: [Date],
        viewCooldown: { type: Map, of: Date, default: {} },
            twoFAEnabled: { type: Boolean, default: true },
    twoFACode: { type: String },
    twoFAExpires: { type: Date },
    pendingDevice: { fp: String, label: String, ip: String },
    knownDevices: [{ fp: String, label: String, lastUsed: Date }],
    sessions: [{ sid: String, device: String, ip: String, createdAt: { type: Date, default: Date.now } }],
    
    portfolioSections: {
      projects: { type: Boolean, default: true },
      certificates: { type: Boolean, default: true },
      skills: { type: Boolean, default: true },
      ratings: { type: Boolean, default: true },
      activity: { type: Boolean, default: true },
      education: { type: Boolean, default: true },
      links: { type: Boolean, default: true },
    },

    links: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      website: { type: String, default: '' },
    },

    education: [
      {
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        field: { type: String, default: '' },
        startYear: { type: Number , required: true},
        endYear: { type: Number , required: true},
        gpa: {  type:String },

      },
    ],

    avatarUrl: { type: String, default: null },
    idCardUrl: { type: String, default: null },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followedTopics: [{ type: String, trim: true }],
    pinnedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectPost' }],

        blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

        
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified'], default: 'unverified' },

    // NEW (Milestone 5): reputation + email verification
    points: { type: Number, default: 0 },
    emailVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationCodeExpires: { type: Date, default: null },
    googleId: { type: String, default: null },

    // Anti-Troll System
    strikes: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// PERFORMANCE: database indexes for fast searching
userSchema.index({ university: 1, major: 1 });
userSchema.index({ skills: 1 });

// SECURITY: Hash password before saving (Mongoose 8 async style)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);