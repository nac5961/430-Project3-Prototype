// Import custom files
const models = require('../models');
const helper = require('./helper.js');

// Get the Account models
const Account = models.Account;

// Function to display the home page
const homePage = (req, res) => res.render('home');

// Function to display the about page
const aboutPage = (req, res) => res.render('about');

// Function to logout the user by removing their
// session and sending them back to the home page
const logout = (req, res) => {
  req.session.destroy();
  return res.redirect('/');
};

// Function to handle POST requests for logging in
const login = (req, res) => {
  const session = req.session;

  // This converts the data to strings to make
  // sure we're saving string data
  const username = helper.verifyString(`${req.body.username}`);
  const password = helper.verifyString(`${req.body.password}`);

  // Validate data
  if (!username || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if the username and password exists in the database
  return Account.AccountModel.authenticateUser(username, password, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong username or password' });
    }

	// Save the user's account information in their session
    session.account = Account.AccountModel.toSession(account);

	// Send the user to the app
    return res.json({ redirect: '/display' });
  });
};

// Function to handle POST requests for signing up
const signup = (req, res) => {
  const session = req.session;

  // This converts the data to strings to make
  // sure we're saving string data
  const username = helper.verifyString(`${req.body.username}`);
  const password = helper.verifyString(`${req.body.password}`);
  const password2 = helper.verifyString(`${req.body.password2}`);

  // Validate data
  if (!username || !password || !password2) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if passwords match
  if (password !== password2) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  return Account.AccountModel.encryptPassword(password, (salt, hash) => {
	// Create data to save to the database
    const accountData = {
      username,
      salt,
      password: hash,
    };

	// Create the document to save to the collection in the database
    const newAccount = new Account.AccountModel(accountData);

	// Get the save promise from the save operation
    const savePromise = newAccount.save();

	// If the promise completes, save the user's account
	// info in their session and send them to the app
    savePromise.then(() => {
      session.account = Account.AccountModel.toSession(newAccount);

      return res.json({ redirect: '/display' });
    });

	// If the promise fails, send the appropriate error
	// message back to the user
    savePromise.catch((err) => {
      console.log(err);

      if (err.code === 11000) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      return res.status(400).json({ error: 'An error occurred' });
    });
  });
};

// Function to update the user's password
const updatePassword = (req, res) => {
  const sessionAcc = req.session.account;

  // This converts the data to strings to make
  // sure we're saving string data
  const oldPassword = helper.verifyString(`${req.body.oldPassword}`);
  const newPassword = helper.verifyString(`${req.body.newPassword}`);
  const newPassword2 = helper.verifyString(`${req.body.newPassword2}`);

  // Verify data
  if (!oldPassword || !newPassword || !newPassword2) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if passwords match
  if (newPassword !== newPassword2) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  // Check if the oldPassword is correct
  return Account.AccountModel.authenticateUser(sessionAcc.username, oldPassword, (err, account) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }

    if (!account) {
      return res.status(401).json({ error: 'Wrong password' });
    }

	// Update the password
    return Account.AccountModel.updatePassword(account._id, newPassword, (err2, doc) => {
      if (err2) {
        console.log(err2);
        return res.status(400).json({ error: 'An error occurred' });
      }

      if (!doc) {
        return res.json({ message: 'Account does not exist' });
      }

      return res.json({ message: 'Password Updated' });
    });
  });
};

// Function to give each page a one-time token
// to protect against stealing sessions
const getToken = (req, res) => res.json({ csrfToken: req.csrfToken() });

module.exports = {
  homePage,
  aboutPage,
  logout,
  login,
  signup,
  update: updatePassword,
  getToken,
};
