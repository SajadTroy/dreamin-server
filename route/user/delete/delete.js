const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.use('/note', require('./note/delete'));

module.exports = router;