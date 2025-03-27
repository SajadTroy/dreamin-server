const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.use('/auth/login', require('./auth/login'));
router.use('/auth/signup', require('./auth/signup'));
router.use('/auth/password', require('./auth/password'));

router.use('/note', require('./note/publish'));

module.exports = router;