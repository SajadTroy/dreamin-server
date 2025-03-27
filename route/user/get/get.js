const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.use('/profile', require('./profile/fetch'));
router.use('/notes', require('./note/fetch'));

module.exports = router;