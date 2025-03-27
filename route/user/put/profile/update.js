const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../../../../models/User');
const isLogged = require('../../../../middleware/checkLogged');

router.put('/update', isLogged, async (req, res, next) => {
    try {
        const { _id: userId } = req.user;
        const { username, gender, about, profile_picture, country } = req.body;

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
        if (profile_picture) {
            const base64ProfilePicture = Buffer.from(profile_picture, 'binary').toString('base64');
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
