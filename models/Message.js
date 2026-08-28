const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, maxlength: 1000, default: '' },
    imageUrl: { type: String, default: null },
    fileUrl: { type: String, default: null },   // NEW: any file (pdf, zip...)
    fileName: { type: String, default: null },  // NEW
    audioUrl: { type: String, default: null },  // NEW: voice notes
    forwarded: { type: Boolean, default: false }, // NEW
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null }, // NEW
    deleted: { type: Boolean, default: false }, // NEW: delete for everyone
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);