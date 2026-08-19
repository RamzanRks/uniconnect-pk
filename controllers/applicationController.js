const asyncHandler = require('../utils/asyncHandler');
const Application = require('../models/Application');
const ProjectPost = require('../models/ProjectPost');

// @desc    Apply to join a project
// @route   POST /api/applications/project/:projectId
const applyToProject = asyncHandler(async (req, res) => {
  const project = await ProjectPost.findById(req.params.projectId);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  if (project.creator.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot apply to your own project.');
  }

  const existing = await Application.findOne({ project: project._id, applicant: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('You have already applied to this project.');
  }

  const application = await Application.create({
    project: project._id,
    applicant: req.user._id,
    message: req.body.message,
  });
  res.status(201).json(application);
});

// @desc    Project owner views all applicants
// @route   GET /api/applications/project/:projectId
const getProjectApplications = asyncHandler(async (req, res) => {
  const project = await ProjectPost.findById(req.params.projectId);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  if (project.creator.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the project owner can view applicants.');
  }

  const applications = await Application.find({ project: project._id })
    .sort({ createdAt: -1 })
    .populate('applicant', 'firstName lastName university major skills email');
  res.json(applications);
});

// @desc    Owner accepts or rejects an applicant
// @route   PUT /api/applications/:id/status
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const application = await Application.findById(req.params.id).populate('project');
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }
  if (application.project.creator.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the project owner can update applications.');
  }

  application.status = status;
  await application.save();
  res.json(application);
});

module.exports = { applyToProject, getProjectApplications, updateApplicationStatus };