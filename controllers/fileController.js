const asyncHandler = require('../utils/asyncHandler');
const ProjectFile = require('../models/ProjectFile');
const ProjectPost = require('../models/ProjectPost');

const MAX_FILES = 10;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB — keeps Cloudinary free tier safe

// @desc    List project files
const getFiles = asyncHandler(async (req, res) => {
  const files = await ProjectFile.find({ project: req.params.id })
    .sort({ createdAt: -1 })
    .populate('uploader', 'firstName lastName avatarUrl');
  res.json(files);
});

// @desc    Upload a file (team members only, max 10 files / 5MB)
const uploadFile = asyncHandler(async (req, res) => {
  const post = await ProjectPost.findById(req.params.id);
  if (!post) { res.status(404); throw new Error('Project not found'); }
  const isTeam = post.creator.toString() === req.user._id.toString() || post.team.some((t) => t.toString() === req.user._id.toString());
  if (!isTeam && req.user.role !== 'admin') { res.status(403); throw new Error('Only team members can upload files.'); }

  const count = await ProjectFile.countDocuments({ project: post._id });
  if (count >= MAX_FILES) { res.status(400); throw new Error(`File limit reached (${MAX_FILES} per project). Delete old files first.`); }
  if (!req.file) { res.status(400); throw new Error('No file uploaded.'); }
  if (req.file.size > MAX_SIZE) { res.status(400); throw new Error('Max file size is 5MB.'); }

  const url = req.file.path && req.file.path.startsWith('http') ? req.file.path : `/uploads/${req.file.filename}`;
  const file = await ProjectFile.create({
    project: post._id, uploader: req.user._id, name: req.file.originalname, url, size: req.file.size, type: req.file.mimetype,
  });
  res.status(201).json(file);
});

// @desc    Delete a file (uploader / project owner / admin)
const deleteFile = asyncHandler(async (req, res) => {
  const file = await ProjectFile.findById(req.params.id);
  if (!file) { res.status(404); throw new Error('File not found'); }
  const post = await ProjectPost.findById(file.project);
  const allowed = file.uploader.toString() === req.user._id.toString() || (post && post.creator.toString() === req.user._id.toString()) || req.user.role === 'admin';
  if (!allowed) { res.status(403); throw new Error('Not authorized'); }
  await file.deleteOne();
  res.json({ message: 'File deleted.' });
});

module.exports = { getFiles, uploadFile, deleteFile };