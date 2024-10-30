// routes/admin.js

const express = require('express');
const router = express.Router();
const path = require('path');
const Admin = require('../models/Admin');
const Post = require('../models/Post');
const Poll = require('../models/Poll');
const bcrypt = require('bcrypt');

// Middleware to check if admin is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  } else {
    res.redirect('/admin/login');
  }
}

// GET admin login page
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin-login.html'));
});

// POST admin login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).send('Invalid username or password');
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).send('Invalid username or password');
    }

    // Set session and redirect to admin dashboard
    req.session.adminId = admin._id;
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).send('Server Error');
  }
});

// GET admin dashboard (protected route)
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin-dashboard.html'));
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/admin/login');
  });
});

// DELETE a post (replace title and content with [CONTENT DELETED])
router.delete('/posts/:postId', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    post.title = '[CONTENT DELETED]';
    post.content = '[CONTENT DELETED]';
    await post.save();

    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET all posts (for admin dashboard)
router.get('/posts', isAuthenticated, async (req, res) => {
  try {
    const posts = await Post.find().sort({ timestamp: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE a poll (replace question and options with [CONTENT DELETED])
router.delete('/polls/:pollId', isAuthenticated, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found.' });
    }

    poll.question = '[CONTENT DELETED]';
    poll.options = [];
    await poll.save();

    res.json({ message: 'Poll deleted successfully.' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET all polls (for admin dashboard)
router.get('/polls', isAuthenticated, async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
