const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../../../../models/User');

router.post('/signup', async (req, res) => {
    const { email, password, dateOfBirth } = req.body;

    try {

        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Email is required'
            });
        }

        if (!password) {
            return res.status(400).json({
                status: 'error',
                message: 'Password is required'
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

        user = new User({
            email,
            password,
            dateOfBirth
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

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
                token
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;