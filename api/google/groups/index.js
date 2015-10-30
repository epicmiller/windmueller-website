var auth = require('../../../lib/auth.js');
var google = require('googleapis');
var Promise = require('bluebird');

exports.GET = function(req, res){
  return new Promise(function(resolve, reject){
    var req = google.admin('directory_v1').members.list({
      auth: res.locals.google.auth,
      groupKey: 'family@windmueller.org',
      maxResults: 100,
      fields: 'members',
      nextPageToken: 'true'
    }, function(err, response) {
      if (err) reject(err);
      resolve({status: 'success', data: response});
    });
  });
};

exports.DELETE = function(req, res){
  return new Promise(function(resolve, reject){
    var req = google.admin('directory_v1').members.delete({
      auth: res.locals.google.auth,
      groupKey: 'family@windmueller.org',
      memberKey: req.data.email,
    }, function(err, response) {
      if (err) reject(err);
      resolve({status: 'success', data: response});
    });
  });
};

exports.POST = function(req, res){
  return new Promise(function(resolve, reject){
    var req = google.admin('directory_v1').members.insert({
      auth: res.locals.google.auth,
      groupKey: 'family@windmueller.org',
      memberKey: req.data.email,
    }, function(err, response) {
      if (err) reject(err);
      resolve({status: 'success', data: response});
    });
  });
};