// routes/admin.js

const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');

// Middleware to check if admin is logged in
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
  req.session.destroy();
  res.redirect('/admin/login');
});

module.exports = router;
