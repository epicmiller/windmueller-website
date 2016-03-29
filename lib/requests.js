var https = require('https');
var parse = require('url').parse;
var querystring = require('querystring');
var request = require('request');

module.exports.doPost = function doPost(body, callback) {
  var options = {
    host: 'accounts.google.com',
    port: 443,
    path: '/o/oauth2/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  };

  var httpsReq = https.request(options, function (response) {
    var data = '';
    response.on("data", function (chunk) {
      data += chunk.toString();
    });
    response.on('end', function () {
      if(response.statusCode !== 200) return callback(new Error('Token fetch return non 200 response code.'), data);
      try { callback(null, JSON.parse(data)); }
      catch(e){ callback(e, data); }
    });
  });

  httpsReq.write(querystring.stringify(body));

  httpsReq.on('error', callback);

  httpsReq.end();
};


module.exports.doRequest =  function doRequest(url, params, callback) {
  var parsedUrl = parse(url);
  var path = parsedUrl.pathname + '?' + querystring.stringify(params);

  var options = {
    host: parsedUrl.host || 'www.google.com',
    port: 443,
    path: path,
    method: 'GET'
  };

  var httpsReq = https.request(options, function (httpsRes) {
    if (httpsRes.statusCode === 401 || httpsRes.statusCode === 403) {
      return callback(null, httpsRes);
    } else {
      var data = '';

      httpsRes.on('data', function (moreData) {
        data += moreData;
      });

      httpsRes.on('end', function () {
        // Don't try to parse profile pictures as JSON
        if (httpsRes.headers['content-type'] &&
          httpsRes.headers['content-type'].indexOf('image') === 0) {
          return callback(null, data);
        }

        try {
          callback(null, JSON.parse(data.toString()));
        } catch (err) {
          callback(err + ": " + data.toString(), null);
        }
      });
    }
  });

  httpsReq.on('error', function (e) {
    callback(e, null);
  });

  httpsReq.end();
};



/**
 * Default transporter constructor.
 * Wraps request and callback functions.
 */
function DefaultTransporter() {}

/**
 * Default user agent.
 */
DefaultTransporter.prototype.USER_AGENT = 'rebound-application';

/**
 * Configures request options before making a request.
 * @param {object} opts Options to configure.
 * @return {object} Configured options.
 */
DefaultTransporter.prototype.configure = function(opts) {
  // set transporter user agent
  opts.headers = opts.headers || {};
  opts.headers['User-Agent'] = opts.headers['User-Agent'] ?
    opts.headers['User-Agent'] + ' ' + this.USER_AGENT : this.USER_AGENT;
  return opts;
};

/**
 * Makes a request with given options and invokes callback.
 * @param {object} opts Options.
 * @param {Function=} opt_callback Optional callback.
 * @return {Request} Request object
 */
DefaultTransporter.prototype.request = function(opts, opt_callback) {
  opts = this.configure(opts);
  return request(opts.uri || opts.url, opts, this.wrapCallback_(opt_callback));
};

/**
 * Wraps the response callback.
 * @param {Function=} opt_callback Optional callback.
 * @return {Function} Wrapped callback function.
 * @private
 */
DefaultTransporter.prototype.wrapCallback_ = function(opt_callback) {
  return function(err, res, body) {
    if (err || !body) {
      return opt_callback && opt_callback(err, body, res);
    }
    // Only and only application/json responses should
    // be decoded back to JSON, but there are cases API back-ends
    // responds without proper content-type.
    try {
      body = JSON.parse(body);
    } catch (err) { /* no op */ }

    if (body && body.error) {
      if (typeof body.error === 'string') {
        err = new Error(body.error);
        err.code = res.statusCode;

      } else if (Array.isArray(body.error.errors)) {
        err = new Error(body.error.errors.map(
                         function(err) { return err.message; }
                       ).join('\n'));
        err.code = body.error.code;
        err.errors = body.error.errors;

      } else {
        err = new Error(body.error.message);
        err.code = body.error.code || res.statusCode;
      }

      body = null;

    } else if (res.statusCode >= 500) {
      // Consider all '500 responses' errors.
      err = new Error(body);
      err.code = res.statusCode;
      body = null;
    }

    if (opt_callback) {
      opt_callback(err, body, res);
    }
  };
};

/**
 * Exports DefaultTransporter.
 */
module.exports.DefaultTransporter = DefaultTransporter;
