// scripts/createAdmin.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    try {
      // Prompt the user for admin credentials (username and password)
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      // Function to get input from the console
      const askQuestion = (query) => {
        return new Promise((resolve) => {
          readline.question(query, (answer) => {
            resolve(answer);
          });
        });
      };

      // Get the admin username
      const username = await askQuestion('Enter admin username: ');
      // Check if the username already exists
      const existingAdmin = await Admin.findOne({ username });
      if (existingAdmin) {
        console.log('An admin with this username already exists.');
        readline.close();
        mongoose.connection.close();
        return;
      }

      // Get the admin password
      const password = await askQuestion('Enter admin password: ');
      readline.close();

      // Create a new admin
      const admin = new Admin({ username, password });
      await admin.save();
      console.log('Admin user created successfully.');
    } catch (error) {
      console.error('Error creating admin user:', error);
    } finally {
      // Close the MongoDB connection
      mongoose.connection.close();
    }
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });
