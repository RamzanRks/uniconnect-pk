const jwt = require('jsonwebtoken');

const generateToken = (id, role, sid) => {
  const payload = { id, role };
  if (sid) payload.sid = sid;
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
};

module.exports = generateToken;