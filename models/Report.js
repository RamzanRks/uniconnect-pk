const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ['ProjectPost', 'User', 'QA_Post'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetType' },

    // WHICH part is being reported (for profile reports)
    targetArea: {
      type: String,
      enum: ['post', 'project', 'question', 'dp', 'profile_info', 'other'],
      default: 'other',
    },

    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    reason: {
      type: String,
      enum: [
        'Spam', 'Harassment', 'Bullying', 'Hate Speech', 'Sexual Content',
        'Nudity', 'Violence', 'Threats', 'Fake Profile', 'Impersonation',
        'Misinformation', 'Plagiarism', 'Copyright Violation', 'Fraud or Scam',
        'Self-Harm', 'Drug Promotion', 'Privacy Violation', 'Inappropriate DP',
        'Offensive Username', 'Other',
      ],
      required: true,
    },
    details: { type: String, maxlength: 500 },

    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);