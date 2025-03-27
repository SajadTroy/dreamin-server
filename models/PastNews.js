const mongoose = require('mongoose');

const pastNewsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
        unique: true
    },
    published: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PastNews', pastNewsSchema);
