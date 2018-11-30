// Import libraries
const moment = require('moment');

// Import custom files
const models = require('../models');
const helper = require('./helper.js');

// Get the Payment Model
const Payment = models.Payment;

// Function to display the expenses page
const expensePage = (req, res) => res.render('expenses');

// Function to display the premium page
const premiumPage = (req, res) => res.render('premium');

// Function to display the account page
const accountPage = (req, res) => res.render('account', { csrfToken: req.csrfToken() });

// Function to display the create/update page
const createPage = (req, res) => res.render('create');

// Function to display the display page
const displayPage = (req, res) => res.render('display', { csrfToken: req.csrfToken() });

// Function to store one payment temporarily in
// the session before we delete it
const storePaymentInSession = (req, res) => {
  const session = req.session;

  // This converts the data to strings to make
  // sure we're saving string data
  const name = helper.verifyString(`${req.body.name}`);

  // Verify data
  if (!name) {
    return res.status(400).json({ error: 'Payment name is required' });
  }

  return Payment.PaymentModel.findOneByOwner(name, session.account._id, (err, doc) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }

    if (!doc) {
      return res.json({ message: 'No payment found' });
    }

	// Save the payment in the session
    session.payment = Payment.PaymentModel.toSession(doc);

	// Redirect to create page to auto-fill form with payment
    return res.json({ redirect: '/create' });
  });
};

// Function to get the temporarily stored payment data
const getPaymentInSession = (req, res) => res.json({ payment: req.session.payment });

// Function to remove the temporarily stored payment data
const removePaymentInSession = (req, res) => {
  const session = req.session;
  session.payment = null;

  return res.end();
};

// Function to get one payment for the user
const getOnePayment = (req, res) => {
  // This converts the data to strings to make
  // sure we're saving string data
  const name = helper.verifyString(`${req.query.name}`);

  // Verify data
  if (!name) {
    return res.status(400).json({ error: 'Payment name is required' });
  }

  return Payment.PaymentModel.findOneByOwner(name, req.session.account._id, (err, doc) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }

	// Return an empty array to maintain consistency
    if (!doc) {
      return res.json({ payments: [] });
    }

	// Return the payment to display
    return res.json({ payments: [doc] });
  });
};

// Function to get all the payments for the user
const getAllPayments = (req, res) => {
  Payment.PaymentModel.findAllByOwner(req.session.account._id, (err, docs) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }

    return res.json({ payments: docs });
  });
};

// Function to create a payment
const createPayment = (req, res) => {
  // Convert all input to get data in the
  // format that we want
  const name = helper.verifyString(`${req.body.name}`);
  const cost = Number(`${req.body.cost}`);
  const dueDate = moment(`${req.body.dueDate}`, 'MM-DD-YYYY').startOf('day');
  const priority = helper.verifyString(`${req.body.priority}`);

  // Get today and yesterday to verify the due date
  const today = moment().startOf('day');
  const yesterday = moment().subtract(1, 'days').startOf('day');

  // Validate data
  if (!name || !req.body.cost || !req.body.dueDate || !priority) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Make sure the priority is valid
  switch (priority.toLowerCase()) {
    case 'low':
    case 'normal':
    case 'high':
      break;
    default:
      return res.status(400).json({ error: 'Invalid priority' });
  }

  // Make sure the cost is valid
  if (!cost) {
    return res.status(400).json({ error: 'Invalid cost' });
  }

  // Limit the cost to $1,000,000
  if (cost > 1000000) {
    return res.status(400).json({ error: 'Max cost is 1 million' });
  }

  // Make sure the date is valid
  if (!dueDate.isValid()) {
    return res.status(400).json({ error: 'Invalid date' });
  }

  // Make sure due date is at least today
  if (!dueDate.isAfter(yesterday, 'day')) {
    return res.status(400).json({ error: 'Due date must be today or later' });
  }

  // Make sure the date is within 10 years from now
  if (dueDate.diff(today, 'years', true) > 10) {
    return res.status(400).json({ error: 'Due date must be within 10 years' });
  }

  // Create the data to save to the database
  const paymentData = {
    ownerId: req.session.account._id,
    name,
    nameAndId: `${name}${req.session.account._id}`,
    cost: Number(cost.toFixed(2)),
    dueDate: dueDate.toDate(),
    priority: priority.toLowerCase(),
  };

  // Create a new document with that data to save to the database
  const newPayment = new Payment.PaymentModel(paymentData);

  // Perform the save
  const savePromise = newPayment.save();

  // If save successful (display success message)
  savePromise.then(() => {
    res.json({ message: 'Payment Created', success: true });
  });

  // If save failed (notify user)
  savePromise.catch((err) => {
    console.log(err);

    if (err.code === 11000) {
      return res.status(400).json({ error: 'Payment already exists' });
    }

    return res.status(400).json({ error: 'An error occurred' });
  });

  return savePromise;
};

// Function to update a payment
const updatePayment = (req, res) => {
  // Convert all input to get data in the
  // format that we want
  const name = helper.verifyString(`${req.body.name}`);
  const cost = Number(`${req.body.cost}`);
  const dueDate = moment(`${req.body.dueDate}`, 'MM-DD-YYYY').startOf('day');
  const priority = helper.verifyString(`${req.body.priority}`);

  // Get today to verify the due date
  const today = moment().startOf('day');

  // Validate data
  if (!name || !req.body.cost || !req.body.dueDate || !priority) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Make sure the priority is valid
  switch (priority.toLowerCase()) {
    case 'low':
    case 'normal':
    case 'high':
      break;
    default:
      return res.status(400).json({ error: 'Invalid priority' });
  }

  // Make sure the cost is valid
  if (!cost) {
    return res.status(400).json({ error: 'Invalid cost' });
  }

  // Limit the cost to $1,000,000
  if (cost > 1000000) {
    return res.status(400).json({ error: 'Max cost is 1 million' });
  }

  // Make sure the date is valid
  if (!dueDate.isValid()) {
    return res.status(400).json({ error: 'Invalid date' });
  }

  // Make sure the date is within 10 years from now
  if (dueDate.diff(today, 'years', true) > 10) {
    return res.status(400).json({ error: 'Due date must be within 10 years' });
  }

  // Set updated payment data
  const paymentData = {
    cost: Number(cost.toFixed(2)),
    dueDate: dueDate.toDate(),
    priority: priority.toLowerCase(),
  };

  // Get the account id in the session
  const accountId = req.session.account._id;

  return Payment.PaymentModel.updateOneByOwner(name, accountId, paymentData, (err, doc) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }

    if (!doc) {
      return res.json({ message: 'No payment found' });
    }

    return res.json({ message: 'Payment Updated', success: true });
  });
};

// Function to delete a payment
const deletePayment = (req, res) => {
  // This converts the data to strings to make
  // sure we're saving string data
  const name = helper.verifyString(`${req.body.name}`);

  // Verify data
  if (!name) {
    return res.status(400).json({ error: 'Payment name is required' });
  }

  return Payment.PaymentModel.deleteOneByOwner(name, req.session.account._id, (err, doc) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }

    if (!doc) {
      return res.json({ message: 'No payment found' });
    }

    return res.json({ message: 'Payment Deleted' });
  });
};

// Function to convert a date filter into a mongoDB query
const createDateQuery = (req, res, filter) => {
  let query = {};

  // Get today and tomorrow to apply the filters
  const today = moment().startOf('day').toDate();
  const tomorrow = moment().add(1, 'days')
					.startOf('day')
					.toDate();

  // Create the query accordingly
  switch (filter.toLowerCase()) {
    case 'overdue':
      query = { $lt: today };

      break;
    case 'today':
      query = { $eq: today };

      break;
    case 'tomorrow':
      query = { $eq: tomorrow };

      break;
    case 'later':
      query = { $gt: tomorrow };

      break;
    default:
      return res.status(400).json({ error: 'Invalid filter' });
  }

  return query;
};

// Function to convert a priority filter into a mongoDB query
const createPriorityQuery = (req, res, filter) => {
  let query = {};

  // Create the query accordingly
  switch (filter.toLowerCase()) {
    case 'low':
      query = { $eq: 'low' };

      break;
    case 'normal':
      query = { $eq: 'normal' };

      break;
    case 'high':
      query = { $eq: 'high' };

      break;
    default:
      return res.status(400).json({ error: 'Invalid filter' });
  }

  return query;
};

// Function to get a filtered list of payments
const filterPayments = (req, res) => {
  let query = {};
  const sort = {};

  // This converts the data to strings to make
  // sure we're using string data.
  // We keep an unconverted dateFilter because
  // we want to check if it is an array (multiple filters)
  const dateFilter = req.query.date;
  const dateFilterStr = helper.verifyString(`${req.query.date}`);
  const costFilterStr = helper.verifyString(`${req.query.cost}`);
  const wordFilterStr = helper.verifyString(`${req.query.word}`);
  const priorityFilter = req.query.priority;
  const priorityFilterStr = helper.verifyString(`${req.query.priority}`);

  // Render all payments if no filter is present
  if (!dateFilter && !dateFilterStr && !costFilterStr && !wordFilterStr &&
  !priorityFilter && !priorityFilterStr) {
    return getAllPayments(req, res);
  }

  // Check if dateFilter is a string and set date query
  if (dateFilter && dateFilter.constructor !== Array) {
    query.dueDate = createDateQuery(req, res, dateFilterStr);
  }

  // Check if dateFilter is an array and set date query
  if (dateFilter && dateFilter.constructor === Array && dateFilter.length > 0) {
	// Use $or operator to use multiple queries
    query.$or = [];

    for (let i = 0; i < dateFilter.length; i++) {
		// Cast item to string
      const filter = `${dateFilter[i]}`;

		// Create date query
      const filterObj = {
        dueDate: createDateQuery(req, res, filter),
      };

		// Add query to $or operator
      query.$or.push(filterObj);
    }
  }

  // Check if priorityFilter is a string and set priority query
  if (priorityFilter && priorityFilter.constructor !== Array) {
    query.priority = createPriorityQuery(req, res, priorityFilterStr);
  }

  // Check if priorityFilter is an array and set priority query
  if (priorityFilter && priorityFilter.constructor === Array && priorityFilter.length > 0) {
	// Use $or operator to use multiple queries
    const orOperator = {
      $or: [],
    };

	// If an $or operator already exists from the date, use an $and
	// operator to have the $or operators stack
    if (query.$or) {
      const oldQuery = query;
      query = {
        $and: [oldQuery],
      };
    }

    for (let i = 0; i < priorityFilter.length; i++) {
		// Cast item to string
      const filter = `${priorityFilter[i]}`;

		// Create priority query
      const filterObj = {
        priority: createPriorityQuery(req, res, filter),
      };

		// Add query to $or operator
      orOperator.$or.push(filterObj);
    }

	// If there is an $and operator then we are stacking $or operators,
	// else we are only using one $or operator so create it
    if (query.$and) {
      query.$and.push(orOperator);
    }	else {
      query.$or = orOperator.$or;
    }
  }

  // Set cost sort
  if (costFilterStr) {
    switch (costFilterStr.toLowerCase()) {
      case 'lowest':
        sort.cost = 1;
        break;
      case 'highest':
        sort.cost = -1;
        break;
      default:
        return res.status(400).json({ error: 'Invalid filter' });
    }
  }

  // Set word sort
  if (wordFilterStr) {
    switch (wordFilterStr.toLowerCase()) {
      case 'a-z':
        sort.name = 1;
        break;
      case 'z-a':
        sort.name = -1;
        break;
      default:
        return res.status(400).json({ error: 'Invalid filter' });
    }
  }

  // Only set date sort if cost sort or word sort isn't being used
  if (!costFilterStr && !wordFilterStr) {
    sort.dueDate = 1;
  }

  // Get the account id in the session
  const accountId = req.session.account._id;

  return Payment.PaymentModel.findPaymentsWithFilter(accountId, query, sort, (err, docs) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }

    return res.json({ payments: docs });
  });
};

module.exports = {
  expensePage,
  premiumPage,
  accountPage,
  createPage,
  displayPage,
  getPayments: getAllPayments,
  create: createPayment,
  update: updatePayment,
  remove: deletePayment,
  search: getOnePayment,
  filter: filterPayments,
  createTemp: storePaymentInSession,
  getTemp: getPaymentInSession,
  removeTemp: removePaymentInSession,
};
