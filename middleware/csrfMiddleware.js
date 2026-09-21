const crypto = require('crypto');

// In-memory CSRF token store (use Redis in production for multi-instance)
const csrfTokens = new Map();

// Clean expired tokens every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of csrfTokens.entries()) {
    if (expiry < now) csrfTokens.delete(token);
  }
}, 10 * 60 * 1000);

/**
 * Generate a CSRF token and return it.
 * Called after successful authentication.
 */
const generateCsrfToken = (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + 60 * 60 * 1000; // 1 hour
  csrfTokens.set(token, expiry);
  return token;
};

/**
 * Middleware: Attach CSRF token to response for authenticated users.
 */
const attachCsrfToken = (req, res, next) => {
  if (req.user) {
    const token = generateCsrfToken(req.user._id.toString());
    res.setHeader('X-CSRF-Token', token);
  }
  next();
};

/**
 * Middleware: Validate CSRF token on mutation requests.
 * Applied to POST, PUT, DELETE, PATCH.
 */
const validateCsrf = (req, res, next) => {
  // Skip for non-mutation methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for auth endpoints (login/register don't have a token yet)
  const skipPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/google', '/api/auth/forgot-password'];
  if (skipPaths.some((p) => req.originalUrl.startsWith(p))) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'];

  if (!csrfToken) {
    return res.status(403).json({ message: 'CSRF token missing. Request rejected.' });
  }

  if (!csrfTokens.has(csrfToken)) {
    return res.status(403).json({ message: 'Invalid or expired CSRF token.' });
  }

  // Token is single-use: delete after validation
  csrfTokens.delete(csrfToken);

  // Generate a new token for the next request
  const newToken = generateCsrfToken(req.user?._id?.toString() || 'anonymous');
  res.setHeader('X-CSRF-Token', newToken);

  next();
};

module.exports = { generateCsrfToken, attachCsrfToken, validateCsrf };