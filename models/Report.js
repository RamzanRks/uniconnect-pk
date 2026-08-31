const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    targetType: { type: String, required: true }, // ProjectPost | QA_Post | User | Comment
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    details: { type: String, default: '' },
    targetArea: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);