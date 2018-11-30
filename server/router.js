// Import custom files
const controllers = require('./controllers');
const mid = require('./middleware');

// Setup routing for requests
const router = (app) => {
  // GET
  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.homePage);
  app.get('/about', mid.requiresSecure, mid.requiresLogout, controllers.Account.aboutPage);

  app.get('/logout', mid.requiresSecure, mid.requiresLogin, controllers.Account.logout);
  app.get('/display', mid.requiresSecure, mid.requiresLogin, controllers.Payment.displayPage);
  app.get('/create', mid.requiresSecure, mid.requiresLogin, controllers.Payment.createPage);
  app.get('/account', mid.requiresSecure, mid.requiresLogin, controllers.Payment.accountPage);
  app.get('/premium', mid.requiresSecure, mid.requiresLogin, controllers.Payment.premiumPage);
  app.get('/expenses', mid.requiresSecure, mid.requiresLogin, controllers.Payment.expensePage);

  app.get('/getTemp', mid.requiresSecure, mid.requiresLogin, controllers.Payment.getTemp);
  app.get('/getToken', mid.requiresSecure, controllers.Account.getToken);
  app.get('/filter', mid.requiresSecure, mid.requiresLogin, controllers.Payment.filter);
  app.get('/search', mid.requiresSecure, mid.requiresLogin, controllers.Payment.search);
  app.get('/getPayments', mid.requiresSecure, mid.requiresLogin, controllers.Payment.getPayments);

  app.get('/*', mid.requiresSecure, mid.rerouteNotFound, controllers.Account.homePage);

  // POST
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

  app.post('/createPayment', mid.requiresSecure, mid.requiresLogin, controllers.Payment.create);
  app.post('/createTemp', mid.requiresSecure, mid.requiresLogin, controllers.Payment.createTemp);

  // DELETE
  app.delete('/removePayment', mid.requiresSecure, mid.requiresLogin, controllers.Payment.remove);
  app.delete('/removeTemp', mid.requiresSecure, mid.requiresLogin, controllers.Payment.removeTemp);

  // PUT
  app.put('/updateAccount', mid.requiresSecure, mid.requiresLogin, controllers.Account.update);

  app.put('/updatePayment', mid.requiresSecure, mid.requiresLogin, controllers.Payment.update);
};

module.exports = router;
