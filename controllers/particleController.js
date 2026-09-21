const asyncHandler = require('../utils/asyncHandler');
const { generateForUser } = require('../utils/particle');

// POST /api/particle/regenerate
exports.regenerate = asyncHandler(async (req, res) => {
  const url = await generateForUser(req.user._id);
  res.json({ particleCutoutUrl: url });
});

// GET /api/particle/status
exports.status = asyncHandler(async (req, res) => {
  res.json({ particleCutoutUrl: req.user.particleCutoutUrl || '' });
});


const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

// PNG must be truecolor-with-alpha (color type 6) = has transparency
const isPngWithAlpha = (buf) =>
  buf && buf.length > 25 &&
  buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
  buf[25] === 6;

// POST /api/particle/upload-cutout  (manual transparent PNG)
exports.uploadCutout = [
  upload.single('cutout'),
  asyncHandler(async (req, res) => {
    if (!req.file) { res.status(400); throw new Error('No file uploaded'); }
    if (req.file.mimetype !== 'image/png' || !isPngWithAlpha(req.file.buffer)) {
      res.status(400);
      throw new Error('Please upload a PNG with a transparent background (remove the background first).');
    }
    const { saveCutoutForUser } = require('../utils/particle');
    const url = await saveCutoutForUser(req.user._id, req.file.buffer);
    res.json({ particleCutoutUrl: url });
  }),
];