const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female', 'others']
    },
    date_of_birth: {
        type: Date,
        required: true,
        validate: {
            validator: function(v) {
                const today = new Date();
                const age = today.getFullYear() - v.getFullYear();
                const monthDiff = today.getMonth() - v.getMonth();
                const dayDiff = today.getDate() - v.getDate();
                return age > 14 || (age === 14 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));
            },
            message: 'User must be at least 14 years old and date of birth must be in the past'
        }
    },
    date_created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);