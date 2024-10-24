// routes/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const axios = require('axios');

// Middleware to simulate user authentication (replace with real auth in production)
function fakeAuth(req, res, next) {
  // Simulate a user ID (in a real app, you'd get this from the session or token)
  // For simplicity, we're using the client's IP address as a unique identifier
  req.userId = req.ip; // Note: This is not reliable for production use
  next();
}

router.use(fakeAuth);

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
    const userId = req.userId;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: 'Post not found.' });

    if (!post.voters) post.voters = new Map();

    const previousVote = post.voters.get(userId) || 0;

    if (previousVote === 1) {
      return res.status(400).json({ message: 'You have already upvoted this post.' });
    }

    // Update votes
    post.upvotes += 1;
    if (previousVote === -1) post.downvotes -= 1;

    // Record the vote
    post.voters.set(userId, 1);
    await post.save();

    res.json({ upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (error) {
    console.error('Error upvoting post:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Downvote a post
router.post('/:id/downvote', async (req, res) => {
  try {
    const userId = req.userId;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: 'Post not found.' });

    if (!post.voters) post.voters = new Map();

    const previousVote = post.voters.get(userId) || 0;

    if (previousVote === -1) {
      return res.status(400).json({ message: 'You have already downvoted this post.' });
    }

    // Update votes
    post.downvotes += 1;
    if (previousVote === 1) post.upvotes -= 1;

    // Record the vote
    post.voters.set(userId, -1);
    await post.save();

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
    if (!post) return res.status(404).json({ message: 'Post not found.' });

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
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    res.json(post.comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Upvote a comment
router.post('/:postId/comments/:commentId/upvote', async (req, res) => {
  try {
    const userId = req.userId;
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    if (!comment.voters) comment.voters = new Map();

    const previousVote = comment.voters.get(userId) || 0;

    if (previousVote === 1) {
      return res.status(400).json({ message: 'You have already upvoted this comment.' });
    }

    // Update votes
    comment.upvotes += 1;
    if (previousVote === -1) comment.downvotes -= 1;

    // Record the vote
    comment.voters.set(userId, 1);
    await post.save();

    res.json({ upvotes: comment.upvotes, downvotes: comment.downvotes });
  } catch (error) {
    console.error('Error upvoting comment:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Downvote a comment
router.post('/:postId/comments/:commentId/downvote', async (req, res) => {
  try {
    const userId = req.userId;
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    if (!comment.voters) comment.voters = new Map();

    const previousVote = comment.voters.get(userId) || 0;

    if (previousVote === -1) {
      return res.status(400).json({ message: 'You have already downvoted this comment.' });
    }

    // Update votes
    comment.downvotes += 1;
    if (previousVote === 1) comment.upvotes -= 1;

    // Record the vote
    comment.voters.set(userId, -1);
    await post.save();

    res.json({ upvotes: comment.upvotes, downvotes: comment.downvotes });
  } catch (error) {
    console.error('Error downvoting comment:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
