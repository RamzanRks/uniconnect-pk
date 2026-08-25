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
      match: [/\.edu(\.pk)?$/i, 'Please use a valid university .edu or .edu.pk email address'],
    },

    password: { type: String, required: true, minlength: [8, 'Password must be at least 8 characters'], select: false },
    university: { type: String, required: [true, 'University name is required'], trim: true },
    major: { type: String, required: true, trim: true },
    skills: [{ type: String, trim: true }],
    bio: { type: String, maxlength: 300, default: '' },
    location: { type: String, default: '' },

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
        startYear: { type: Number },
        endYear: { type: Number },
      },
    ],

    avatarUrl: { type: String, default: null },
    idCardUrl: { type: String, default: null },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // NEW (Milestone 4): topic following + pinned projects
    followedTopics: [{ type: String, trim: true }],
    pinnedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectPost' }],

    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified'], default: 'unverified' },

    // Anti-Troll System
    strikes: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// PERFORMANCE: database indexes for fast searching
userSchema.index({ university: 1, major: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ username: 1 });

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