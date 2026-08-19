const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    content: { 
      type: String, 
      required: [true, 'Answer cannot be empty'], 
      minlength: [10, 'Answer must be at least 10 characters.'] 
    },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Can be marked as the "Accepted Solution" by the person who asked
    isAccepted: { type: Boolean, default: false } 
  },
  { timestamps: true }
);

module.exports = mongoose.model('Answer', answerSchema);