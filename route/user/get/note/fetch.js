const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const User = require('../../../../models/User');
const isLogged = require('../../../../middleware/checkLogged');
const Post = require('../../../../models/Post');

// Helper function to recursively fetch child notes
const fetchChildNotes = async (parentId) => {
    const childNotes = await Post.find({ parent_note: parentId })
        .populate('user', 'username profile_picture')
        .lean();

    for (const child of childNotes) {
        child.child_notes = await fetchChildNotes(child._id);
    }

    return childNotes;
};

// Route to fetch a single post by ID with child notes
router.get('/:id', isLogged, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }

        const post = await Post.findById(id).populate('user', 'username profile_picture').lean();

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.child_notes = await fetchChildNotes(post._id);

        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to fetch all posts in the order of latest with child notes
router.get('/', isLogged, async (req, res) => {
    try {
        const posts = await Post.find({ parent_note: null })
            .sort({ date_posted: -1 })
            .populate('user', 'username profile_picture')
            .lean();

        for (const post of posts) {
            post.child_notes = await fetchChildNotes(post._id);
        }

        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;