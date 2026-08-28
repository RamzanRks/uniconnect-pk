const express = require('express');
const router = express.Router();
const { getHub } = require('../controllers/hubController');

router.get('/:university', getHub);

module.exports = router;
