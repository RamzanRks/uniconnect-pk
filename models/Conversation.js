const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectPost', default: null },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    starter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
    requestCount: { type: Number, default: 0 },

    isGroup: { type: Boolean, default: false },
    name: { type: String, default: '' },
    description: { type: String, default: '' },   // NEW
    groupPhoto: { type: String, default: null },  // NEW
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // NEW: per-user chat settings
    pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    mutedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);