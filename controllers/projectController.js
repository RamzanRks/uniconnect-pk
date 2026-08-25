const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');
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

// @desc    Get open project posts with search, filters & personalized feed
// @route   GET /api/projects?search=&skill=&university=&feed=forYou&pageNumber=
const getProjectPosts = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const filter = { status: 'open' };

  // NEW (Milestone 4): personalized "For You" feed from followed topics
  if (req.query.feed === 'forYou') {
    const token = (req.headers.authorization || '').split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const me = await User.findById(decoded.id);
        const topics = me?.followedTopics || [];
        if (topics.length) {
          const escaped = topics.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
          filter.requiredSkills = { $regex: `^(${escaped.join('|')})$`, $options: 'i' };
        }
      } catch (e) { /* ignore bad token on public feed */ }
    }
  }

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
    .populate('creator', 'firstName lastName university verificationStatus avatarUrl');

  res.json({ posts, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Get distinct skills & universities for filter dropdowns
// @route   GET /api/projects/filters
const getFilterOptions = asyncHandler(async (req, res) => {
  const skills = await ProjectPost.distinct('requiredSkills');
  const universities = await User.distinct('university');
  res.json({ skills: skills.sort(), universities: universities.sort() });
});

// @desc    Owner updates project progress (planning/building/completed)
// @route   PUT /api/projects/:id/progress
const updateProgress = asyncHandler(async (req, res) => {
  const { progress } = req.body;
  const post = await ProjectPost.findById(req.params.id);
  if (!post) { res.status(404); throw new Error('Post not found'); }
  if (post.creator.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the project owner can update progress.');
  }
  post.progress = progress;
  await post.save();
  res.json(post);
});

// @desc    Owner pins/unpins a project to their profile (max 3)
// @route   POST /api/projects/:id/pin
const togglePin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const id = req.params.id;
  const post = await ProjectPost.findById(id);
  if (!post) { res.status(404); throw new Error('Post not found'); }
  if (post.creator.toString() !== user._id.toString()) {
    res.status(403);
    throw new Error('Only your own projects can be pinned.');
  }

  if (user.pinnedProjects.some((p) => p.toString() === id)) {
    user.pinnedProjects = user.pinnedProjects.filter((p) => p.toString() !== id);
  } else {
    if (user.pinnedProjects.length >= 3) {
      res.status(400);
      throw new Error('You can pin up to 3 projects.');
    }
    user.pinnedProjects.push(post._id);
  }
  await user.save();
  res.json({ pinnedProjects: user.pinnedProjects });
});

module.exports = { createProjectPost, getProjectPosts, getFilterOptions, updateProgress, togglePin };