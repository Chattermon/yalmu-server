// routes/polls.js

const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');

// Middleware to simulate user authentication (replace with real auth in production)
function fakeAuth(req, res, next) {
  req.userId = req.ip;
  next();
}

router.use(fakeAuth);

// Get the current poll
router.get('/', async (req, res) => {
  try {
    const poll = await Poll.findOne().sort({ createdAt: -1 });
    if (!poll) {
      return res.status(404).json({ message: 'No poll available.' });
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

    // Check if user has already voted
    if (poll.voters.get(userId) !== undefined) {
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
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get poll results (optional)
router.get('/:pollId/results', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found.' });
    res.json(poll);
  } catch (error) {
    console.error('Error fetching poll results:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
