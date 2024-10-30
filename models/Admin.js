// models/Admin.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define the Admin schema
const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Ensure the username is unique
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// Pre-save hook to hash the password before saving
AdminSchema.pre('save', async function (next) {
  try {
    // Check if the password field has been modified
    if (this.isModified('password')) {
      const saltRounds = 10; // Number of hashing rounds
      // Generate a salt and hash the password
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare a candidate password with the stored hash
AdminSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Export the Admin model
module.exports = mongoose.model('Admin', AdminSchema);
