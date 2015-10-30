/**
* Module dependencies.
*/

  var UNIQUE_KEY = 'unique-key-here';
  var PORT = '3006';

// Core Dependencies
  var path            = require('path');
  var bodyParser      = require('body-parser');
  var compress        = require('compression');
  var colour          = require('colour');
  var cookieParser    = require('cookie-parser');
  var csrf            = require('csurf');
  var errorHandler    = require('errorhandler');
  var express         = require('express');
  var enforce_ssl     = require('express-enforces-ssl');
  var helmet          = require('helmet');
  var http            = require('http');
  var methodOverride  = require('method-override');
  var logger          = require('morgan');
  var multer          = require('multer');
  var path            = require('path');
  var api             = require('rebound-api');
  var favicon         = require('serve-favicon');
  var ghost           = require('ghost');

// Session Manageent
  var session         = require('express-session');
  var RedisStore      = require('connect-redis')(session);

// Dev Flag
  var devEnv = (process.env.NODE_ENV == 'production') ? false : true;

// Init Core
  var app = express();
      app.set('port', PORT);
      app.use(compress()); // Compress everything we send
      app.use(favicon(__dirname + '/assets/images/favicon.png')); // Deliver favicon
      app.use(logger('dev')); // Dev level logging
      app.use(bodyParser.json()); // Parse received json values
      app.use(bodyParser.urlencoded({extended: true})); // Parse URL encoded values
      app.use(methodOverride()); // enable DELETE and PUT
      app.use(cookieParser(UNIQUE_KEY)); // Use cookie parser, required before session.

// Development Logging
  if(devEnv) app.use(errorHandler());

// Load Our Google APIs
app.get('*', require('./lib/google'));

// Set Helmet Security Headers
  app.use(helmet.xframe()); // frame busting
  app.use(helmet.xssFilter()); // ie9+ and chrome xss busting
  app.use(helmet.csp({
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'code.jquery.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'", 'fonts.gstatic.com'],
    objectSrc: ["'self'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'", 'groups.google.com'],
    reportUri: '/put-xss-logging-uri-here',
    reportOnly: false, // set to true if you only want to report errors
    setAllHeaders: true, // set to true if you want to set all headers
    safari5: false // set to true if you want to force buggy CSP in Safari 5
  }));
  var ninetyDaysInMilliseconds = 7776000000;
  app.use(helmet.hsts({ maxAge: ninetyDaysInMilliseconds })); // force https
  app.use(helmet.hidePoweredBy({ setTo: 'PHP 4.2.0' })); // throw off attackers by saying we're using php instead of express
  app.use(helmet.ienoopen()); // obscure old ie xss html inject bug
  app.use(helmet.nosniff()); // only accept files of correct mime type

// Force https if in production environment
  if(!devEnv){
    // app.set('trust proxy', 1);
    // app.use(enforce_ssl());
  }

// Set Static Content Locations
  app.use(express.static(path.join(__dirname, 'dist')));

// Initiate Sessions.
  app.use(session({
    secret: UNIQUE_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: !devEnv,
      maxAge: (3600000 * 3),
      httpOnly: true
    }
  }));

// // Enable csrf
//   app.use(csrf());

// // csrf error handler
//   app.use(function (err, req, res, next) {
//     if (err.code !== 'EBADCSRFTOKEN'){ return next(err); }
//     res.status(403);
//     res.json({status: 'error', message: 'Session has expired or form tampered with'});
//   });
//
// // Set our csrf cookie for the session on first load
//   app.use(function(req, res, next){
//     // Create a csrf token for this session, or use the existing one
//     req.session.csrf || (req.session.csrf = req.csrfToken());
//     // Save it in a cookie. Browser sends this in the x-csrf-token header.
//     res.cookie('csrf', req.session.csrf, {
//       maxAge: (1000 * 10),
//       signed: false
//     });
//     next();
//   });

// Get Ghost Config
  ghost({
    config: path.join(__dirname, 'ghost/config.js')
  }).then(function (ghostServer) {
      // Start the ghost server
        app.use(ghostServer.config._config.paths.subdir, ghostServer.rootApp);
        ghostServer.start();

      // Enable Uploads
        app.use(multer({ dest: './dist/tmp/uploads/' }));

      // Automatically discover API in /api. Must be last middleware.
        app.use(api(express));
  });


// Start Server
  http.createServer(app).listen(app.get('port'), function(){
    console.log(('✔ Express server listening on port ' + app.get('port')).green.bold);
    // If user id and group id are set, force process to run with those permissions
    if(process.env.GID && process.env.UID){
      process.setgid(process.env.GID);
      process.setuid(process.env.UID);
    }
  });
