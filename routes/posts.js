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
        res.status(500).json({ message: 'Server Error' });
    }
});

// Submit a new post
router.post('/', async (req, res) => {
    const { title, content, author, authorAvatar } = req.body;

    if (!title || !content || !author) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // OpenAI Moderation API
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

        const { flagged } = moderationResponse.data.results[0];
        if (flagged) {
            return res.status(400).json({ message: 'Content is inappropriate.' });
        }

        const newPost = new Post({
            title,
            content,
            author,
            authorAvatar,
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
