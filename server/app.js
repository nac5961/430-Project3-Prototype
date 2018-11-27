// Import libraries
const path = require('path'); // Built-in library to handle file system paths
const express = require('express'); // MVC framework library
const compression = require('compression'); // Library for compressing(gzip) responses
const favicon = require('serve-favicon'); // Library for handling favicon requests
const cookieParser = require('cookie-parser'); // Library to parse cookies from requests
const bodyParser = require('body-parser'); // Library for parsing the body of POST requests
const mongoose = require('mongoose'); // MongoDB library
const expressHandlebars = require('express-handlebars'); // For handlebars templating
const session = require('express-session'); // Library for keeping track of user sessions (cookies)
const RedisStore = require('connect-redis')(session); // Redis library
const url = require('url'); // Library for parsing URLs
const csrf = require('csurf'); // Library for security against CSRF (stealing of sessions)

// Import custom files
const router = require('./router.js');

// Set environment variables
const port = process.env.PORT || process.env.NODE_PORT || 3000;
const mongoURL = process.env.MONGODB_URI || 'mongodb://localhost/TrackerLocal';

// Setup connection to mongoDB
// Stop server if connection failed
mongoose.connect(mongoURL, (err) => {
  if (err) {
    console.log('Could not connect to the database.');
    throw err;
  }
});

// Setup Redis connection info
let redisURL = {
  hostname: 'localhost',
  port: 6379,
};

let redisPASS;

if (process.env.REDISCLOUD_URL) {
  redisURL = url.parse(process.env.REDISCLOUD_URL);
  redisPASS = redisURL.auth.split(':')[1];
}

// Setup express
const app = express();

app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted/`))); // Route to /assets
app.use(favicon(`${__dirname}/../hosted/img/favicon.png`)); // Middleware to handle favicon requests
app.disable('x-powered-by'); // Hides header that shows the server framework for security reasons
app.use(compression()); // Setup middleware to compress responses to make them smaller and faster
app.use(bodyParser.json()); // Setup middleware to parse json data in the body of the requests
app.use(bodyParser.urlencoded({
  extended: true,
})); // Setup middleware to parse urlencoded data in the body of requests

app.use(session({
  key: 'sessionid',
  store: new RedisStore({
    host: redisURL.hostname,
    port: redisURL.port,
    pass: redisPASS,
  }),
  secret: 'Payment Tracker',
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
  },
})); // Setup middleware to use sessions (the cookies used to keep track of user sessions)

app.engine('handlebars', expressHandlebars({ defaultLayout: 'main' })); // Hook up handlebars
app.set('view engine', 'handlebars'); // Setup the view to use handlebars
app.set('views', `${__dirname}/../views`); // Sets the path to the views

app.use(cookieParser()); // Setup middleware for parsing cookies

// csrf must come AFTER app.use(cookieParser());
// and app.use(session({......}));
// should come BEFORE the router
app.use(csrf()); // Setup middleware for security against CSRF
app.use((err, req, res, next) => {
  // If everything is ok, continue on with the request
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

  // Do nothing if someone tampered with the session or doesn't have a token
  console.log('Missing CSRF token');
  return false;
}); // Error handling

// Setup routing
// Pass express to the router for handling requests
router(app);

// Start the server
app.listen(port, (err) => {
  if (err) {
    throw err;
  }

  console.log(`Listening on port ${port}`);
});

