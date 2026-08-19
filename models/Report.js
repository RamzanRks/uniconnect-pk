const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ['ProjectPost', 'User', 'QA_Post'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetType' },
    
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    reason: { 
      type: String, 
      enum: ['Spam', 'Inappropriate', 'Fake Profile', 'Harassment', 'Other'], 
      required: true 
    },
    details: { type: String, maxlength: 500 }, // Optional context from the reporter
    
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);