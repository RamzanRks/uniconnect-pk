const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Question title is required'], maxlength: 150 },
    content: { 
      type: String, 
      required: [true, 'Question details are required'], 
      minlength: [20, 'Question must be at least 20 characters.'] 
    },
    tags: [{ type: String, trim: true }], // e.g., ['React', 'Mongoose', 'Error']
    
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isResolved: { type: Boolean, default: false },
    
    // Anti-Troll Tracking (Same as ProjectPosts)
    reportCount: { type: Number, default: 0 },
    reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['open', 'hidden'], default: 'open' }
  },
  { timestamps: true }
);

questionSchema.index({ tags: 1, createdAt: -1 });

// Auto-hide if 3 reports
questionSchema.pre('save', async function () {
  if (this.reportCount >= 3 && this.status !== 'hidden') {
    this.status = 'hidden';
  }
});

module.exports = mongoose.model('Question', questionSchema);