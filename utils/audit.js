const AuditLog = require('../models/AuditLog');

const logAudit = async (admin, action, targetType = '', targetLabel = '', details = '', ip = '') => {
  try { await AuditLog.create({ admin, action, targetType, targetLabel, details, ip }); } catch (e) { /* never break flow */ }
};

module.exports = { logAudit };