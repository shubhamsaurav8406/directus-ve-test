require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var pageRouter = require('./routes/page');
var authRouter = require('./routes/auth');
var { requireAuth } = require('./lib/auth-middleware');

var app = express();

// If running behind a reverse proxy (App Service, ingress, etc.), allow secure cookies to work correctly.
app.set('trust proxy', 1);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
const sessionCookieSecure = process.env.SESSION_COOKIE_SECURE === 'true';
const sessionCookieSameSite = (process.env.SESSION_COOKIE_SAMESITE || (sessionCookieSecure ? 'none' : 'lax')).toLowerCase();

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: sessionCookieSecure,
    httpOnly: true,
    sameSite: sessionCookieSameSite,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// CSP header to allow iframe embedding
app.use(function(req, res, next) {
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  next();
});

app.use(function(req, res, next) {
  res.locals.DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://localhost:8085';
  next();
});

// Auth routes (no protection needed)
app.use('/', authRouter);

// Protected routes - require authentication
app.use('/', requireAuth, indexRouter);
app.use('/page', requireAuth, pageRouter);
app.use('/users', requireAuth, usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
