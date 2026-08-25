const mongoose = require('mongoose');
const ratingSchema = new mongoose.Schema({
  rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectPost', required: true },
  stars: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 300, default: '' },
}, { timestamps: true });
ratingSchema.index({ rater: 1, ratee: 1, project: 1 }, { unique: true });
module.exports = mongoose.model('Rating', ratingSchema);