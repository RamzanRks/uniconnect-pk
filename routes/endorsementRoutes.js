const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { toggleEndorsement, getEndorsements } = require('../controllers/endorsementController');

router.post('/', protect, toggleEndorsement);
router.get('/:userId', protect, getEndorsements);

module.exports = router;