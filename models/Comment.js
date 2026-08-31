const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectPost', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    text: { type: String, required: true, maxlength: 500 },
    reportCount: { type: Number, default: 0 },
    reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.pre('save', async function () {
  if (this.reportCount >= 3 && !this.hidden) this.hidden = true;
});

module.exports = mongoose.model('Comment', commentSchema);