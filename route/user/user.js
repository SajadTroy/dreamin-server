const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.use('/post', require('./post/post'));
router.use('/get', require('./get/get'));

module.exports = router;