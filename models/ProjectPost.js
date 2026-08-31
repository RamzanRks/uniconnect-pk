const mongoose = require('mongoose');

const projectPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Project title is required'], maxlength: 100 },
    description: { type: String, required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters to prevent spam.'] },
    requiredSkills: [{ type: String, required: true }],
    deadline: { type: Date, required: [true, 'Project deadline is required'] },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'closed', 'hidden'], default: 'open' },
    progress: { type: String, enum: ['planning', 'building', 'completed'], default: 'planning' },
    reportCount: { type: Number, default: 0 },
    reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // NEW (Milestone 5): Visible team members
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    screenshots: [{ type: String, default: [] }],
  },
  { timestamps: true }
);

projectPostSchema.index({ status: 1, createdAt: -1 });
projectPostSchema.index({ requiredSkills: 1 });
projectPostSchema.index({ team: 1 });

projectPostSchema.pre('save', async function () {
  if (this.reportCount >= 3 && this.status !== 'hidden') {
    this.status = 'hidden';
  }
});

module.exports = mongoose.model('ProjectPost', projectPostSchema);