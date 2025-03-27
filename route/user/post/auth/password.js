const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Email = require('../../../../email');

router.post('/change', async (req, res) => {
    const { username, email, oldPassword, newPassword } = req.body;

    try {
        // Find the user by username or email
        const user = await mongoose.model('User').findOne({
            $or: [{ username }, { email }]
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate the old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid old password' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Save the updated user
        await user.save();

        // Send an email to the user
        await Email.send(
            user.email,
            'Password Updated',
            'Your password has been updated successfully \n If you did not make this change, please contact us immediately',
            '<p>Your password has been updated successfully</p><p>If you did not make this change, please contact us immediately</p>',
            (err, info) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(info);
                }
            }
        );

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;