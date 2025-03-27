const mongoose = require('mongoose');

const factCheckSchema = new mongoose.Schema({
    claim: {
        type: String,
        required: [true, 'Claim is required'],
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    fact: {
        type: String,
        required: [true, 'Fact status is required'],
        enum: {
            values: ['fake', 'real', 'misleading'],
            message: '{VALUE} is not a valid fact status'
        },
        lowercase: true
    },
    confidence_level: {
        type: Number,
        required: [true, 'Confidence level is required'],
        min: [0, 'Confidence level must be at least 0'],
        max: [100, 'Confidence level must be at most 100']
    },
    claim_english: {
        type: String,
        required: [true, 'English claim is required'],
        trim: true
    },
    explanation: {
        type: String,
        required: [true, 'Explanation is required'],
        trim: true
    },
    explanation_english: {
        type: String,
        required: [true, 'English explanation is required'],
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FactCheck', factCheckSchema);
