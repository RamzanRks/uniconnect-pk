const asyncHandler = require('../utils/asyncHandler');
const Certificate = require('../models/Certificate');

const getCertificates = asyncHandler(async (req, res) => {
  const certs = await Certificate.find({ user: req.params.id }).sort({ featured: -1, year: -1, createdAt: -1 });
  res.json(certs);
});

const createCertificate = asyncHandler(async (req, res) => {
  const { title, issuer, year, category, credentialUrl, featured } = req.body;
  if (!title) { res.status(400); throw new Error('Certificate title is required.'); }
  if (!req.file) { res.status(400); throw new Error('Please upload the certificate image/pdf.'); }
  const count = await Certificate.countDocuments({ user: req.user._id });
  if (count >= 20) { res.status(400); throw new Error('Maximum 20 certificates.'); }
  const url = req.file.path && req.file.path.startsWith('http') ? req.file.path : `/uploads/${req.file.filename}`;
  const cert = await Certificate.create({
    user: req.user._id, title, issuer: issuer || '', year: year ? Number(year) : null,
    category: category || 'course', credentialUrl: credentialUrl || '', featured: featured === 'true' || featured === true, url,
  });
  res.status(201).json(cert);
});

const toggleFeatured = asyncHandler(async (req, res) => {
  const cert = await Certificate.findById(req.params.id);
  if (!cert) { res.status(404); throw new Error('Certificate not found'); }
  if (cert.user.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
  cert.featured = !cert.featured;
  await cert.save();
  res.json(cert);
});

const deleteCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findById(req.params.id);
  if (!cert) { res.status(404); throw new Error('Certificate not found'); }
  if (cert.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') { res.status(403); throw new Error('Not authorized'); }
  await cert.deleteOne();
  res.json({ message: 'Certificate deleted.' });
});

// @desc    Fully edit a certificate
const updateCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findById(req.params.id);
  if (!cert) { res.status(404); throw new Error('Certificate not found'); }
  if (cert.user.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
  const { title, issuer, year, category, credentialUrl, featured } = req.body;
  if (title !== undefined) cert.title = title;
  if (issuer !== undefined) cert.issuer = issuer;
  if (year !== undefined) cert.year = year ? Number(year) : null;
  if (category !== undefined) cert.category = category;
  if (credentialUrl !== undefined) cert.credentialUrl = credentialUrl;
  if (featured !== undefined) cert.featured = featured === 'true' || featured === true;
  if (req.file) cert.url = req.file.path && req.file.path.startsWith('http') ? req.file.path : `/uploads/${req.file.filename}`;
  await cert.save();
  res.json(cert);
});

module.exports = { getCertificates, createCertificate, toggleFeatured, deleteCertificate , updateCertificate};