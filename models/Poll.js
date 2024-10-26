// models/Poll.js

const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: String,
  votes: { type: Number, default: 0 },
});

const PollSchema = new mongoose.Schema({
  question: String,
  options: [OptionSchema],
  voters: { type: Map, of: String }, // Map of user IDs to their selected option
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date, // If we want the poll to expire weekly
});

module.exports = mongoose.model('Poll', PollSchema);
