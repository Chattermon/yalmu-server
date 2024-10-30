// routes/polls.js

const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');

// Middleware to simulate user authentication (replace with real auth in production)
function fakeAuth(req, res, next) {
  // Use the user's IP address as a unique identifier
  req.userId = req.ip;
  next();
}

router.use(fakeAuth);

// Get the current active poll
router.get('/', async (req, res) => {
  try {
    const now = new Date();

    const poll = await Poll.findOne({
      createdAt: { $lte: now },
      expiresAt: { $gte: now },
    }).sort({ createdAt: -1 });

    if (!poll) {
      return res.status(404).json({ message: 'No active poll available.' });
    }
    res.json(poll);
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Submit a vote
router.post('/:pollId/vote', async (req, res) => {
  const { optionIndex } = req.body;
  const userId = req.userId;

  if (typeof optionIndex !== 'number') {
    return res.status(400).json({ message: 'Invalid option index.' });
  }

  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found.' });
    }

    // Check if user has already voted
    if (poll.voters && poll.voters.includes(userId)) {
      return res.status(400).json({ message: 'You have already voted.' });
    }

    // Validate option index
    if (optionIndex >= 0 && optionIndex < poll.options.length) {
      // Increment the vote count
      poll.options[optionIndex].votes += 1;

      // Initialize voters array if it doesn't exist
      if (!poll.voters) {
        poll.voters = [];
      }

      // Add the user to the list of voters
      poll.voters.push(userId);

      await poll.save();
      res.json({ message: 'Vote submitted successfully.', poll });
    } else {
      res.status(400).json({ message: 'Invalid option selected.' });
    }
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Create a new poll
router.post('/create', async (req, res) => {
  const { question, options } = req.body;

  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ message: 'Invalid poll data. Please provide a question and at least two options.' });
  }

  const pollOptions = options.map((optionText) => ({
    text: optionText,
    votes: 0,
  }));

  const newPoll = new Poll({
    question,
    options: pollOptions,
    voters: [],
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in one week
  });

  try {
    await newPoll.save();
    res.status(201).json({ message: 'Poll created successfully.', poll: newPoll });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get all polls (admin use)
router.get('/all', async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
