const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const chatUpload = require('../middleware/chatUploadMiddleware');
const { getCertificates, createCertificate, deleteCertificate,toggleFeatured , updateCertificate,} = require('../controllers/certificateController');

router.get('/user/:id', getCertificates);
router.post('/', protect, chatUpload.single('cert'), createCertificate);
router.delete('/:id', protect, deleteCertificate);
router.put('/:id/featured', protect, toggleFeatured);
router.put('/:id', protect, chatUpload.single('cert'), updateCertificate);

module.exports = router;