// models/Poll.js

const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: String,
  votes: { type: Number, default: 0 },
});

const PollSchema = new mongoose.Schema({
  question: String,
  options: [OptionSchema],
  voters: { type: Map, of: String, default: {} }, // Initialize with an empty map
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date,
});

// Check if the model already exists to prevent OverwriteModelError
module.exports = mongoose.models.Poll || mongoose.model('Poll', PollSchema);
