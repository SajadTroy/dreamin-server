const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/', (req, res) => {
    const startTime = process.hrtime();
    
    const serverStatus = {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    };

    const endTime = process.hrtime(startTime);
    const responseTime = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);

    const apiInfo = {
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip
    };

    res.status(200).json({
        status: 'success',
        latency: `${responseTime}ms`,
        serverStatus: serverStatus,
        requestInfo: apiInfo,
        message: 'POST request to the homepage'
    });
});
router.use('/auth/login', require('./auth/login'));
router.use('/auth/signup', require('./auth/signup'));

module.exports = router;