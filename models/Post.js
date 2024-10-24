// models/Post.js
const mongoose = require('mongoose');

// Schema for comments
const CommentSchema = new mongoose.Schema({
  author: String,
  authorAvatar: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
});

// Schema for posts
const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  authorAvatar: String,
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  comments: [CommentSchema],
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Post', PostSchema);
