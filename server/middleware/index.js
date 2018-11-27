/*
	With all middleware, you must call next();
	to move the request through to the next
	middleware and eventually to the controllers.

	If not, the request will stop being processed.
*/

// Middleware to check if the user is requesting
// an invalid url, in which case we'll re-route
// them accordingly
const rerouteNotFound = (req, res) => {
  if (!req.session.account) {
    return res.redirect('/'); // Not logged in - reroute to homePage
  }

  return res.redirect('/display'); // Logged in - reroute to displayPage
};

// Middleware to check if the user needs to be logged in
// to see the page and redirects them appropriately
// if they are logged out
const requiresLogin = (req, res, next) => {
  if (!req.session.account) {
    return res.redirect('/');
  }

  return next();
};

// Middleware to check if the user needs to be logged out
// to see the page and redirects them appropriately
// if they are logged in
const requiresLogout = (req, res, next) => {
  if (req.session.account) {
    return res.redirect('/display');
  }

  return next();
};

// Middleware to check if the user is using HTTPS and
// redirects them to HTTPS if not
const requiresSecure = (req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.hostname}${req.url}`);
  }

  return next();
};

// Middleware to bypass the check for HTTPS when in development
const bypassSecure = (req, res, next) => next();

module.exports.rerouteNotFound = rerouteNotFound;
module.exports.requiresLogin = requiresLogin;
module.exports.requiresLogout = requiresLogout;

// Note: process.env.NODE_ENV is a custom variable
// we created on Heroku to keep track of our environment.
// Check which middleware to used based on the
// environment (Production or Development)
if (process.env.NODE_ENV === 'PROD') {
  module.exports.requiresSecure = requiresSecure;
} else {
  module.exports.requiresSecure = bypassSecure;
}
