// Import libraries
const crypto = require('crypto'); // Module for handling encrypted data
const mongoose = require('mongoose');

// Set the promise features for mongoose to use
mongoose.Promise = global.Promise;

// Variable to hold the AccountModel once it is created (after the Schema)
let AccountModel = {};

// Converter to convert a string id to an ObjectId
const convertId = mongoose.Types.ObjectId;

// Variables for encrypting data
const iterations = 10000;
const saltLength = 64;
const keyLength = 64;

// Account Schema to define the collection in mongo
const AccountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^[A-Za-z0-9_\-.]{1,16}$/,
  },
  salt: {
    type: Buffer,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

// Function to check if the entered password matches what
// is saved in the database (this is used when logging in)
const checkPassword = (doc, password, callback) => {
  // Get the encrypted password in the database
  const pass = doc.password;

  // Encrypt the password that the user entered
  // Note: hash is the encrypted pass and will be a buffer,
  // so we have to call .toString() to convert it to a string
  return crypto.pbkdf2(password, doc.salt, iterations, keyLength, 'RSA-SHA512', (err, hash) => {
    if (hash.toString('hex') !== pass) {
      return callback(false);
    }

    return callback(true);
  });
};

// Function to get account information that we want to store
// in a user's session (this is the information we store in
// req.session.account)
AccountSchema.statics.toSession = (doc) => ({
  username: doc.username,
  _id: doc._id,
});

// Function to find a user by the username entered
AccountSchema.statics.findByUsername = (username, callback) => {
  const query = {
    username,
  };

  return AccountModel.findOne(query, callback);
};

// Function to update a user's password
AccountSchema.statics.updatePassword = (userId, newPass, callback) => {
  const query = {
    _id: convertId(userId),
  };

  // Encrypt new password and save to database
  return AccountModel.encryptPassword(newPass, (salt, hash) => {
    const update = {
      salt,
      password: hash,
    };

    return AccountModel.findByIdAndUpdate(query, update, callback);
  });
};

// Function to encrypt the password before saving it to
// the database
AccountSchema.statics.encryptPassword = (password, callback) => {
  const salt = crypto.randomBytes(saltLength);

  crypto.pbkdf2(password, salt, iterations, keyLength, 'RSA-SHA512', (err, hash) => {
    callback(salt, hash.toString('hex'));
  });
};

// Function to authenticate the user (check if they used the
// correct username and password)
AccountSchema.statics.authenticateUser = (username, password, callback) => {
  // Get the user data from the database based on the username provided
  AccountModel.findByUsername(username, (err, doc) => {
    if (err) {
      return callback(err);
    }

    if (!doc) {
      return callback();
    }

	// Make sure the password entered by the user matches the one in the database
    return checkPassword(doc, password, (isValidPass) => {
      if (isValidPass) {
        return callback(null, doc);
      }

      return callback();
    });
  });
};

// Create the Account Model
AccountModel = mongoose.model('Account', AccountSchema);

module.exports = {
  AccountSchema,
  AccountModel,
};
