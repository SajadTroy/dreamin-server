const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const User = require('../../../../models/User');
const isLogged = require('../../../../middleware/checkLogged');
const Post = require('../../../../models/Post');

// Route to delete a post and its child notes
router.delete('/:id', isLogged, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to delete this post' });
        }

        // Helper function to recursively delete child notes
        const deleteChildNotes = async (parentId) => {
            const childNotes = await Post.find({ parent_note: parentId });
            for (const child of childNotes) {
                await deleteChildNotes(child._id); // Recursively delete child notes
                await child.deleteOne();
            }
        };

        // Delete child notes first
        await deleteChildNotes(post._id);

        // Delete the parent post
        await post.deleteOne();

        res.status(200).json({ message: 'Post and its child notes deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;