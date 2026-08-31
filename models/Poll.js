const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectPost', required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true, maxlength: 200 },
    options: [{ text: { type: String, required: true, maxlength: 60 }, votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
    multiple: { type: Boolean, default: false },
    closesAt: { type: Date },
    closed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Poll', pollSchema);