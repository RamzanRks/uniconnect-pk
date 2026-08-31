const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getAuditLogs } = require('../controllers/auditController');

router.get('/', protect, adminOnly, getAuditLogs);

module.exports = router;