const express = require('express');
const router = express.Router();
const { login, logout } = require('../lib/directus-auth');
const { requireNoAuth, requireAuth } = require('../lib/auth-middleware');

function getSafeRedirectUrl(redirectUrl) {
  if (!redirectUrl || typeof redirectUrl !== 'string') {
    return '/';
  }

  if (!redirectUrl.startsWith('/') || redirectUrl.startsWith('//')) {
    return '/';
  }

  if (redirectUrl === '/favicon.ico' || /\.[a-zA-Z0-9]+$/.test(redirectUrl)) {
    return '/';
  }

  return redirectUrl;
}

/**
 * GET /login - Show login page
 */
router.get('/login', requireNoAuth, (req, res) => {
  res.render('login', { title: 'Login', redirectUrl: req.session.redirectUrl });
});

/**
 * POST /login - Handle login
 */
router.post('/login', requireNoAuth, async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.render('login', {
      title: 'Login',
      error: 'Email and password are required'
    });
  }
  
  const result = await login(email, password);
  
  if (!result.success) {
    return res.render('login', {
      title: 'Login',
      error: result.error || 'Login failed'
    });
  }
  
  // Store tokens in session
  req.session.access_token = result.access_token;
  req.session.refresh_token = result.refresh_token;
  req.session.user = result.user;
  
  // Redirect to original URL or home
  const redirectUrl = getSafeRedirectUrl(req.session.redirectUrl);
  delete req.session.redirectUrl;

  req.session.save((err) => {
    if (err) {
      return res.render('login', {
        title: 'Login',
        error: 'Unable to persist login session. Please try again.'
      });
    }

    res.redirect(redirectUrl);
  });
});

/**
 * GET /logout - Handle logout
 */
router.get('/logout', requireAuth, async (req, res) => {
  const refreshToken = req.session.refresh_token;
  
  // Logout from Directus
  if (refreshToken) {
    await logout(refreshToken);
  }
  
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      return res.render('error', {
        error: { message: 'Error logging out' },
        message: 'Error logging out'
      });
    }
    res.redirect('/login');
  });
});

module.exports = router;
