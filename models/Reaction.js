const mongoose = require('mongoose');
const reactionSchema = new mongoose.Schema({
  targetType: { type: String, enum: ['ProjectPost', 'Question', 'Answer'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetType' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emoji: { type: String, required: true },
}, { timestamps: true });
reactionSchema.index({ targetType: 1, targetId: 1, user: 1, emoji: 1 }, { unique: true });
module.exports = mongoose.model('Reaction', reactionSchema);