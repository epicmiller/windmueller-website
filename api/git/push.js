
/*
 * On git post event
 */

exports.POST = function(req, res){
  var data = req.body;
  require('../../bin/update');
  return {status: true};
};
