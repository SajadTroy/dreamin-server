const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../../../../models/User');
const Email = require('../../../../email');

const generateRandomUsername = async () => {
    const randomString = Math.random().toString(36).substring(2, 8);
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const username = `user_${randomString}${randomNumber}`;
    const existingUser = await User.findOne({ username });
    return existingUser ? generateRandomUsername() : username;
};

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

        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email'
            });
        }

        if (!dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid date of birth'
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
            date_of_birth: new Date(dateOfBirth),
            username: await generateRandomUsername()
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(randomPassword, salt);

        await user.save();

        // Send email with the generated password
        await Email.send(email,
            'Account Created Successfully',
            `Your account was created successfully. \nPlease log in with the following password: ${randomPassword}. \nWe recommend changing your password after logging in.`,
            (err, info) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log(info);
                }
            }
        );

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
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;