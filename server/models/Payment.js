// Import Libraries
const mongoose = require('mongoose');
const _ = require('underscore');

// Set mongoose promise
mongoose.Promise = global.Promise;

// Variable to hold the Payment Model
let PaymentModel = {};

const convertId = mongoose.Types.ObjectId;
const setString = (value) => _.escape(value).trim();

// Create a schema for the Payment collection
const PaymentSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Account',
  },
  name: {
    type: String,
    trim: true,
    required: true,
    set: setString,
    match: /^[a-zA-Z0-9]+( [a-zA-Z0-9]+)*$/,
  },
  nameAndId: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    set: setString,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  priority: {
    type: String,
    trim: true,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

// Function to get payment information that we want to store
// in a user's session (this is the information we store in
// req.session.payment)
PaymentSchema.statics.toSession = (doc) => ({
  name: doc.name,
  cost: doc.cost,
  dueDate: doc.dueDate,
  priority: doc.priority,
});

// Function to get all payments by the owner
PaymentSchema.statics.findAllByOwner = (ownerId, callback) => {
  const query = {
    ownerId: convertId(ownerId),
  };

  return PaymentModel.find(query).select('name cost dueDate priority').exec(callback);
};

// Function to find one payment by the owner
PaymentSchema.statics.findOneByOwner = (name, ownerId, callback) => {
  const query = {
    name,
    ownerId: convertId(ownerId),
  };

  return PaymentModel.findOne(query).select('name cost dueDate priority').exec(callback);
};

// Function to delete one payment by the owner
PaymentSchema.statics.deleteOneByOwner = (name, ownerId, callback) => {
  const query = {
    name,
    ownerId: convertId(ownerId),
  };

  return PaymentModel.findOneAndRemove(query, callback);
};

// Function to update one payment by the owner
PaymentSchema.statics.updateOneByOwner = (name, ownerId, updatedPayment, callback) => {
  const query = {
    name,
    ownerId: convertId(ownerId),
  };

  return PaymentModel.findOneAndUpdate(query, updatedPayment, callback);
};

// Function to find payments by the owner using a filter
PaymentSchema.statics.findPaymentsWithFilter = (ownerId, filter, sort, callback) => {
  const query = filter;
  query.ownerId = convertId(ownerId);

  const collation = {
    locale: 'en',
    strength: 1,
    caseLevel: true,
  };

  return PaymentModel.find(query)
						.collation(collation)
						.sort(sort)
						.exec(callback);
};

// Create the Payment model
PaymentModel = mongoose.model('Payment', PaymentSchema);

module.exports = {
  PaymentSchema,
  PaymentModel,
};
