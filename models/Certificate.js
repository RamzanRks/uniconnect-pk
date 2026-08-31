const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 100 },
    issuer: { type: String, default: '' },
    year: { type: Number, default: null },
    category: { type: String, enum: ['academic', 'course', 'hackathon', 'achievement'], default: 'course' },
    credentialUrl: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    url: { type: String, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);