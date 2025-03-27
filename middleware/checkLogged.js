const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isLogged = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer')) {
            return res.status(401).json({
                status: 'error',
                message: 'You are not logged in'
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify the token
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if the user exists
        const user = await User.findById(decoded.user.id);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Attach user to the request object
        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token has expired'
            });
        }

        return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }
};

module.exports = isLogged;