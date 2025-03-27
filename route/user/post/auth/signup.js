const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../../../../models/User');
const { sendMail } = require('../../../../email.js');

router.post('/', async (req, res) => {
    const { email, dateOfBirth } = req.body;

    try {
        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Email is required'
            });
        }

        if (!dateOfBirth) {
            return res.status(400).json({
                status: 'error',
                message: 'Date of birth is required'
            });
        }

        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({
                status: 'error',
                message: 'User already exists'
            });
        }

        // Generate a random password
        const randomPassword = Math.random().toString(36).slice(-8);

        user = new User({
            email,
            password: randomPassword,
            dateOfBirth
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(randomPassword, salt);

        await user.save();

        // Send email with the generated password
        await sendMail(email, 'Account Created Successfully', `Your account was created successfully. Please log in with the following password: ${randomPassword}. We recommend changing your password after logging in.`);

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) {
                throw err;
            }

            res.status(200).json({
                status: 'success',
                message: 'Account created successfully. Please check your email for login details.',
                token
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;