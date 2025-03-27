const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../../../../models/User');
const Email = require('../../../../email');

router.post('/', async (req, res) => {
    const { email, password } = req.body;

    try {

        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Email or username is required'
            });
        }

        if (!password) {
            return res.status(400).json({
                status: 'error',
                message: 'Password is required'
            });
        }

        let user = await User.findOne({ email });
        user = await User.findOne({ username: email });

        if (!user) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, async (err, token) => {
            if (err) {
                throw err;
            }

            // Send email to user to notify them of login
            await Email.send(
                user.email,
                'Login Notification',
                `Hello ${user.username},\n\nYou have successfully logged in to your account.\n\nIf you did not perform this action, please contact us immediately`,
                `<p>Hello ${user.username},</p><p>You have successfully logged in to your account.</p><p>If you did not perform this action, please contact us immediately</p>`,
                (err, info) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log(info);
                    }
                }
            );

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