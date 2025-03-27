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
        const { content, parent_note } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        let parentNote = null;

        if (parent_note) {
            if (!mongoose.Types.ObjectId.isValid(parent_note)) {
                return res.status(400).json({ message: 'Invalid parent note ID' });
            }

            parentNote = await Post.findById(parent_note);

            if (!parentNote) {
                return res.status(404).json({ message: 'Parent note not found' });
            }
        }

        const post = new Post({
            user: req.user._id,
            content,
            parent_note: parentNote ? parentNote._id : null
        });

        await post.save();

        res.status(201).json({ message: 'Post published successfully', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;