const express = require('express');
const router = express.Router();

router.use('/post', require('./post/post'));
router.use('/get', require('./get/get'));
router.use('/put', require('./put/put'));
router.use('/delete', require('./delete/delete'));

module.exports = router;