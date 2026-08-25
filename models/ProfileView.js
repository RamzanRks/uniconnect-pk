const mongoose = require('mongoose');
const profileViewSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  viewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  viewedAt: { type: Date, default: Date.now },
});
profileViewSchema.index({ owner: 1, viewer: 1 });
module.exports = mongoose.model('ProfileView', profileViewSchema);