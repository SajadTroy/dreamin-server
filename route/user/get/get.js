const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.use('/profile', require('./profile/fetch'));;

module.exports = router;