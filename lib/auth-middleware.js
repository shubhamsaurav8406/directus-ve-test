const { verifyToken } = require('./directus-auth');
const debug = require('debug')('hello-world:server');

/**
 * Middleware to check if user is authenticated
 */
async function requireAuth(req, res, next) {
  // Check if user has tokens in session
  if (!req.session || !req.session.access_token) {
    debug('No access token found in session, redirecting to login');
    // Store the original URL to redirect back after login
    req.session.redirectUrl = req.originalUrl;
    return res.redirect('/login');
  }
  
  // Verify token is still valid (and refresh if needed)
  const verification = await verifyToken(
    req.session.access_token,
    req.session.refresh_token
  );
  
  if (!verification.valid) {
    debug('Access token invalid and could not be refreshed, redirecting to login');
    // Clear invalid session and store redirect URL
    const redirectUrl = req.originalUrl;
    req.session.destroy(() => {
      req.session = {};
      req.session.redirectUrl = redirectUrl;
      res.redirect('/login');
    });
    return;
  }
  
  // If token was refreshed, update session
  if (verification.token_refreshed) {
    req.session.access_token = verification.new_access_token;
  }
  
  // Store user info in request for use in routes and templates
  req.user = verification.user || req.session.user;
  res.locals.user = req.user;
  debug(`User authenticated: ${req.user.email || req.user.id}`);
  
  next();
}

/**
 * Middleware to redirect to home if already authenticated
 */
function requireNoAuth(req, res, next) {
  if (req.session && req.session.access_token) {
    return res.redirect('/');
  }
  next();
}

module.exports = {
  requireAuth,
  requireNoAuth
};
