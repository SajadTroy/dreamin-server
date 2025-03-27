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
    is_verified: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    gender: {
        type: String,
        required: true,
        default: 'others',
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
    about: {
        type: String,
        maxlength: 100
    },
    profile_picture: {
        type: String,
        default: function() {
            const images = [
                'https://i.postimg.cc/L4tx4LjV/images.webp',
                'https://i.postimg.cc/T1J0kvTs/0075450f923f1014eda02bcd5d682496.webp',
                'https://i.postimg.cc/43jWy18W/batman-pfp-1268.webp'
            ];
            return images[Math.floor(Math.random() * images.length)];
        }
    },
    country: {
        type: String,
        default: 'Unknown'
    },
    date_created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);