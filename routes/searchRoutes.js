const express = require('express');
const router = express.Router();
const { globalSearch, getTrending } = require('../controllers/searchController');

router.get('/', globalSearch);
router.get('/trending', getTrending);

module.exports = router;