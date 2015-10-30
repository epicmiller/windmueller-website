var Promise = require('bluebird');

module.exports.GET = function(req, res) {
  return new Promise(function(resolve, reject){
    res.locals.google.getFeed('https://www.google.com/m8/feeds/contacts/default/full', {'max-results':3},
    function(e, feed) {
      if(e) return reject({status: 'error', message: e});
      resolve({statusn: 'success', data: feed});
    });
  });
};