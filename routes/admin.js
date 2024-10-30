// routes/admin.js

const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Post = require('../models/Post');
const Poll = require('../models/Poll');
const bcrypt = require('bcrypt');
const { isAuthenticated } = require('../middlewares/auth');

// Render the admin login page
router.get('/login', (req, res) => {
  res.sendFile('admin-login.html', { root: 'public' });
});

// Handle admin login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).send('Invalid username or password');
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).send('Invalid username or password');
    }

    // Set session and redirect to dashboard
    req.session.adminId = admin._id;
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).send('Server error');
  }
});

// Admin logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Admin dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile('admin-dashboard.html', { root: 'public' });
});

// Fetch all posts for admin
router.get('/posts', isAuthenticated, async (req, res) => {
  try {
    const posts = await Post.find().sort({ timestamp: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete a post
router.delete('/posts/:postId', isAuthenticated, async (req, res) => {
  try {
    const postId = req.params.postId;
    await Post.findByIdAndUpdate(postId, {
      title: '[CONTENT DELETED]',
      content: '[CONTENT DELETED]',
    });
    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Fetch all polls for admin
router.get('/polls', isAuthenticated, async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete a poll
router.delete('/polls/:pollId', isAuthenticated, async (req, res) => {
  try {
    const pollId = req.params.pollId;
    await Poll.findByIdAndUpdate(pollId, {
      question: '[CONTENT DELETED]',
      options: [],
    });
    res.json({ message: 'Poll deleted successfully.' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
