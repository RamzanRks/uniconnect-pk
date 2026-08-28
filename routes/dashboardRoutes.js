const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMyDashboard } = require('../controllers/dashboardController');

router.get('/', protect, getMyDashboard);

module.exports = router;
