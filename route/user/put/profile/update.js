const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const User = require('../../../../models/User');
const isLogged = require('../../../../middleware/checkLogged');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.put('/update', isLogged, upload.single('profile_picture'), async (req, res, next) => {
    try {
        const { _id: userId } = req.user;
        const { username, gender, about, country } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username) {
            const existingUser = await User.findOne({ username });
            if (existingUser && existingUser._id.toString() !== userId.toString()) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            user.username = username;
        }
        if (gender) user.gender = gender;
        if (about) user.about = about;
        if (req.file) {
            const base64ProfilePicture = req.file.buffer.toString('base64');
            user.profile_picture = base64ProfilePicture;
        }
        if (country) user.country = country;

        await user.save();

        res.status(200).json({ message: 'Profile updated successfully', user_id: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
