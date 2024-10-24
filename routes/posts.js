// routes/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const axios = require('axios');

// Fetch all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ timestamp: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Submit a new post
router.post('/', async (req, res) => {
  const { title, content, author, authorAvatar } = req.body;

  // Basic validation
  if (!title || !content || !author) {
    return res.status(400).json({ message: 'Title, content, and author are required.' });
  }

  try {
    // Prepare inputs for moderation
    const inputs = [title, content];

    // Send both title and content to OpenAI Moderation API
    const moderationResponse = await axios.post(
      'https://api.openai.com/v1/moderations',
      {
        input: inputs,
        model: 'text-moderation-latest',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Validate moderation response structure
    if (
      !moderationResponse.data ||
      !moderationResponse.data.results ||
      !Array.isArray(moderationResponse.data.results) ||
      moderationResponse.data.results.length !== inputs.length
    ) {
      console.error('Unexpected moderation response structure:', moderationResponse.data);
      return res.status(500).json({ message: 'Error processing moderation results.' });
    }

    // Check if either title or content is flagged
    const [titleModeration, contentModeration] = moderationResponse.data.results;

    if (titleModeration.flagged && contentModeration.flagged) {
      return res.status(400).json({ message: 'Both title and content are inappropriate.' });
    }

    if (titleModeration.flagged) {
      return res.status(400).json({ message: 'Title is inappropriate.' });
    }

    if (contentModeration.flagged) {
      return res.status(400).json({ message: 'Content is inappropriate.' });
    }

    // If neither is flagged, proceed to create the post
    const newPost = new Post({
      title,
      content,
      author,
      authorAvatar,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error submitting post:', error);

    // Handle specific OpenAI API errors
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
      return res.status(502).json({ message: 'Error communicating with moderation service.' });
    } else if (error.request) {
      console.error('No response from OpenAI API:', error.request);
      return res.status(502).json({ message: 'No response from moderation service.' });
    } else {
      console.error('Error setting up moderation request:', error.message);
      return res.status(500).json({ message: 'Server Error' });
    }
  }
});

// Upvote a post
router.post('/:id/upvote', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    res.json({ upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (error) {
    console.error('Error upvoting post:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Downvote a post
router.post('/:id/downvote', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { downvotes: 1 } },
      { new: true }
    );
    res.json({ upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (error) {
    console.error('Error downvoting post:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Add a comment to a post
router.post('/:id/comments', async (req, res) => {
  const { author, authorAvatar, content } = req.body;

  if (!content || !author) {
    return res.status(400).json({ message: 'Content and author are required.' });
  }

  try {
    // Moderation
    const moderationResponse = await axios.post(
      'https://api.openai.com/v1/moderations',
      {
        input: content,
        model: 'text-moderation-latest',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const [result] = moderationResponse.data.results;

    if (result.flagged) {
      return res.status(400).json({ message: 'Comment content is inappropriate.' });
    }

    const post = await Post.findById(req.params.id);
    const newComment = {
      author,
      authorAvatar,
      content,
    };
    post.comments.push(newComment);
    await post.save();

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select('comments');
    res.json(post.comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
