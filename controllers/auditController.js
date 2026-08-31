const asyncHandler = require('../utils/asyncHandler');
const AuditLog = require('../models/AuditLog');

const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, q } = req.query;
  const filter = {};
  if (action) filter.action = action;
  if (q) filter.$or = [{ targetLabel: new RegExp(q, 'i') }, { details: new RegExp(q, 'i') }];
  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(500).populate('admin', 'firstName lastName email');
  res.json(logs);
});

module.exports = { getAuditLogs };