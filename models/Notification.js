const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'application', 'application_accepted', 'application_rejected',
        'answer', 'verification_approved', 'verification_rejected',
        'follow', 'name_change_approved', 'name_change_rejected',
        'rating', 'reaction', // NEW (Milestone 4)
      ],
      required: true,
    },
    text: { type: String, required: true },
    link: { type: String, default: '/' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);