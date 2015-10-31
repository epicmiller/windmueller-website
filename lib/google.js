var creds = require('../google_secret.json').web;
var EventEmitter = require('events').EventEmitter;
var https = require('https');
var parse = require('url').parse;
var querystring = require('querystring');
var request = require('./requests');

var Promise = require('bluebird');


var SCOPES = ['https://www.googleapis.com/auth/admin.directory.user',
              'https://www.googleapis.com/auth/admin.directory.group',
              'https://www.googleapis.com/auth/admin.directory.group.member',
              'https://www.googleapis.com/auth/admin.directory.group.member.readonly',
              'https://www.googleapis.com/auth/admin.directory.group.readonly',
              'https://www.google.com/m8/feeds',
              'https://www.googleapis.com/auth/contacts.readonly'
            ];
var OAUTH_BASE = 'https://accounts.google.com/o/oauth2/auth?';
var TOKEN;

var client = new EventEmitter();
client.on('tokenRefresh', function() {
  console.log('Google API Token Refresh:', token);
});

client.getFeed = function (url, params, callback) {
  if (!callback && typeof params === 'function') {
    callback = params;
    params = {};
  }

  params.oauth_token = TOKEN.access_token;

  // Don't request profile photos as JSON
  if (!/photos\/media/.test(url)) {
    params.alt = 'json';
  }

  request.doRequest(url, params, function (err, body) {
    callback(err, body);
  });
};

client.post = function(options, callback) {
  if (!options.qs) options.qs = {};
  if (!options.qs.access_token) options.qs.access_token = TOKEN.access_token;
  request.post(options, function(err, resp, body) {
    if (err) return callback(err, body);
    if (resp.statusCode === 401) {
      return refreshToken(function(err, result) {
        if(!err && result && !result.error && result.access_token) {
          TOKEN.access_token = result.access_token;
          TOKEN.refresh_token = result.refresh_token || TOKEN.refresh_token;
          client.emit('tokenRefresh');
          options.qs.access_token = TOKEN.access_token;
          client.post(options, callback);
        }
      });
    }
    return callback(null, body);
  });
};

client.refreshToken = function refreshToken(callback) {
  request.doPost({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    refresh_token: TOKEN.refresh_token,
    grant_type: 'refresh_token'
  }, function (err, result) {
    if (err || !result || !result.access_token) { console.error('Google API Token Refresh Error: ', err, result); }
    callback(err, result);
  });
};

client.auth = { transporter: {},
  clientId_: creds.client_id,
  clientSecret_: creds.client_secret,
  redirectUri_: 'urn:ietf:wg:oauth:2.0:oob',
  opts: {},
  request: function request_api(opts, uri){
    if(!TOKEN){ return new Error('Invalid Token'); }
    opts || (opts = {headers: {}});
    opts.headers || (opts.headers = {});
    opts.headers.Authorization = TOKEN.token_type + ' ' + TOKEN.access_token;
    var transport = new request.DefaultTransporter();
    return transport.request(opts, uri);
  }
};

module.exports = function googleapis(req, res, next) {
  var redirectURI = req.protocol + '://' + req.get('host') + req.originalUrl.split('?')[0];

  res.locals.google = client;

  // If we already have a token, move on.
  if(TOKEN) return next();

  // If an error occured, run our error callback.
  if (req.query.error) return next(new Error(req.query.error));

  // If this request does not contain a code, redirect to google oauth2 page.
  if (!req.query.code) {

    // Construct our redirect url and redirect browser
    var redirect = OAUTH_BASE + querystring.stringify({
      scope: SCOPES.join(' '),
      access_type: 'offline',
      approval_prompt: 'force',
      client_id: creds.client_id,
      redirect_uri: redirectURI,
      response_type: 'code'
    });

    return res.redirect(redirect);

  }

  // Otherwise, get our token using the auth code.
  request.doPost({
    grant_type: 'authorization_code',
    code: req.query.code,
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    redirect_uri: redirectURI
  }, function (err, tkn) {

    if (!err && tkn && !tkn.error){
      client.auth.credentials = client.token = TOKEN = tkn;
      res.locals.google = client;
      return next();
    }
    console.error('Error fetching auth token.');
    console.error(err, tkn);
    return next(err);
  });
};