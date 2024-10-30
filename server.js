// server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware

// Enable CORS for all routes
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Parse URL-encoded data (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Replace 'your-secret-key' with a secure secret
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI, // MongoDB connection string
    }),
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    },
  })
);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    // Use the new URL parser and unified topology
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes

// Import route handlers
const postsRoute = require('./routes/posts');
const pollsRoute = require('./routes/polls');
const adminRoute = require('./routes/admin');

// Mount routes
app.use('/api/posts', postsRoute);
app.use('/api/polls', pollsRoute);
app.use('/admin', adminRoute);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Real-Time Chat with Socket.io
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for chat messages
  socket.on('chatMessage', (msg) => {
    // Broadcast the message to all connected clients
    io.emit('chatMessage', msg);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
