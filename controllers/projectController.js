const asyncHandler = require('../utils/asyncHandler');
const ProjectPost = require('../models/ProjectPost');
const User = require('../models/User');

// @desc    Create a new project post
// @route   POST /api/projects
const createProjectPost = asyncHandler(async (req, res) => {
  const { title, description, requiredSkills, deadline } = req.body;

  const post = await ProjectPost.create({
    title,
    description,
    requiredSkills,
    deadline,
    creator: req.user._id,
  });

  res.status(201).json(post);
});

// @desc    Get open project posts with search & filters
// @route   GET /api/projects?search=&skill=&university=&pageNumber=
const getProjectPosts = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const filter = { status: 'open' };

  // Text search on title/description (regex-escaped for safety)
  if (req.query.search && req.query.search.trim()) {
    const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  // Filter by required skill
  if (req.query.skill && req.query.skill !== 'all') {
    const escaped = req.query.skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.requiredSkills = { $regex: escaped, $options: 'i' };
  }

  // Filter by university (via creator lookup)
  if (req.query.university && req.query.university !== 'all') {
    const escaped = req.query.university.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({ university: { $regex: escaped, $options: 'i' } }).select('_id');
    filter.creator = { $in: users.map((u) => u._id) };
  }

  const count = await ProjectPost.countDocuments(filter);

  const posts = await ProjectPost.find(filter)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate('creator', 'firstName lastName university verificationStatus');

  res.json({ posts, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Get distinct skills & universities for filter dropdowns
// @route   GET /api/projects/filters
const getFilterOptions = asyncHandler(async (req, res) => {
  const skills = await ProjectPost.distinct('requiredSkills');
  const universities = await User.distinct('university');
  res.json({ skills: skills.sort(), universities: universities.sort() });
});

module.exports = { createProjectPost, getProjectPosts, getFilterOptions };