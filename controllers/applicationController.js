const asyncHandler = require('../utils/asyncHandler');
const Application = require('../models/Application');
const ProjectPost = require('../models/ProjectPost');
const { notifyUser } = require('../utils/socket');


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
  await notifyUser(project.creator, 'application', `${req.user.firstName} ${req.user.lastName} applied to your project "${project.title}"`, '/');
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
   await notifyUser(
    application.applicant,
    status === 'accepted' ? 'application_accepted' : 'application_rejected',
    `Your application for "${application.project.title}" was ${status}.`,
    '/'
  );

  // If accepted, add to project team + award points
  if (status === 'accepted') {
    const project = await ProjectPost.findById(application.project);
    if (project && !project.team.some((id) => id.toString() === application.applicant.toString())) {
      project.team.push(application.applicant);
      await project.save();
    }
    
    const { awardPoints } = require('../utils/points');
    await awardPoints(application.applicant, 10);
  }

  res.json(application);
});

// @desc    Student views their own applications
// @route   GET /api/applications/mine
const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'project',
      select: 'title creator',
      populate: { path: 'creator', select: 'firstName lastName university' },
    });
  res.json(applications);
});

module.exports = { applyToProject, getProjectApplications, updateApplicationStatus, getMyApplications };