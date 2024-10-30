// scripts/createAdmin.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    const username = 'admin';
    const password = 'adminpassword'; // Use a secure password

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log('Admin user already exists.');
    } else {
      const admin = new Admin({ username, password });
      await admin.save();
      console.log('Admin user created.');
    }
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });
