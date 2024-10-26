// routes/polls.js

const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');

// Middleware to simulate user authentication (replace with real auth in production)
function fakeAuth(req, res, next) {
  // Sanitize the IP address to remove invalid characters
  req.userId = req.ip.replace(/\./g, '_').replace(/:/g, '_');
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

  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found.' });

    // Ensure that poll.voters is a Map
    if (!(poll.voters instanceof Map)) {
      poll.voters = new Map(Object.entries(poll.voters));
    }

    // Check if user has already voted
    if (poll.voters.has(userId)) {
      return res.status(400).json({ message: 'You have already voted.' });
    }

    // Validate option index
    if (optionIndex >= 0 && optionIndex < poll.options.length) {
      // Increment the vote count
      poll.options[optionIndex].votes += 1;
      poll.voters.set(userId, optionIndex);
      await poll.save();
      res.json({ message: 'Vote submitted successfully.' });
    } else {
      res.status(400).json({ message: 'Invalid option selected.' });
    }
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Optional: Route to create a new poll (for testing purposes)
router.post('/create', async (req, res) => {
  const { question, options, expiresAt } = req.body;

  if (!question || !options || !Array.isArray(options) || options.length === 0) {
    return res.status(400).json({ message: 'Invalid poll data.' });
  }

  const pollOptions = options.map((optionText) => ({
    text: optionText,
    votes: 0,
  }));

  const newPoll = new Poll({
    question,
    options: pollOptions,
    voters: new Map(),
    createdAt: new Date(),
    expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in one week by default
  });

  try {
    await newPoll.save();
    res.status(201).json({ message: 'Poll created successfully.', poll: newPoll });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
