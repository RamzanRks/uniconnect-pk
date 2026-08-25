const mongoose = require('mongoose');

const projectPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Project title is required'], maxlength: 100 },

    // STRICT VALIDATION: Forces detailed posts, stops low-effort trolls
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters to prevent spam.'],
    },

    requiredSkills: [{ type: String, required: true }],
    deadline: { type: Date, required: [true, 'Project deadline is required'] },

    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    status: { type: String, enum: ['open', 'closed', 'hidden'], default: 'open' },

    // NEW (Milestone 4): owner-controlled progress tracker
    progress: { type: String, enum: ['planning', 'building', 'completed'], default: 'planning' },

    // Anti-Troll Tracking
    reportCount: { type: Number, default: 0 },
    reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// PERFORMANCE: Indexes for the main feed filters
projectPostSchema.index({ status: 1, createdAt: -1 });
projectPostSchema.index({ requiredSkills: 1 });

// AUTOMATION: If a post hits 3 reports, auto-hide it (Mongoose 8 async style)
projectPostSchema.pre('save', async function () {
  if (this.reportCount >= 3 && this.status !== 'hidden') {
    this.status = 'hidden';
  }
});

module.exports = mongoose.model('ProjectPost', projectPostSchema);