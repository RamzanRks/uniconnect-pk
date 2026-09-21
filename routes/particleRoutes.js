const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { regenerate, status, uploadCutout } = require('../controllers/particleController');

router.route('/regenerate').post(protect, regenerate);
router.route('/status').get(protect, status);
// ...existing routes...
router.route('/upload-cutout').post(protect, uploadCutout);

module.exports = router;