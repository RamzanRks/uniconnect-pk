const mongoose = require('mongoose');

const endorsementSchema = new mongoose.Schema(
  {
    endorser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    endorsee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

endorsementSchema.index({ endorser: 1, endorsee: 1, skill: 1 }, { unique: true });

module.exports = mongoose.model('Endorsement', endorsementSchema);