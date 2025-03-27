const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.use('/profile', require('./profile/update'));

module.exports = router;