const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const chatUpload = require('../middleware/chatUploadMiddleware');
const { getFiles, uploadFile, deleteFile } = require('../controllers/fileController');

router.get('/project/:id', getFiles);
router.post('/project/:id', protect, chatUpload.single('file'), uploadFile);
router.delete('/:id', protect, deleteFile);

module.exports = router;