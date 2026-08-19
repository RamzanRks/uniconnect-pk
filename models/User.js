const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },

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
    idCardUrl: { type: String, default: null },

    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified'], default: 'unverified' },

    strikes: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ university: 1, major: 1 });
userSchema.index({ skills: 1 });

// SECURITY: Hash password before saving (Mongoose 8 async style)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);