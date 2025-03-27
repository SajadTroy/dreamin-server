const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const User = require('../../../../models/User');
const isLogged = require('../../../../middleware/checkLogged');
const Post = require('../../../../models/Post');

// Route to publish a post
router.post('/publish', isLogged, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const post = new Post({
            user: req.user._id,
            content
        });

        await post.save();

        res.status(201).json({ message: 'Post published successfully', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;