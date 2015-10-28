
/*
 * On git post event
 */

exports.POST = function(req, res){
  var data = req.body;
  require('../../bin/update');
  res.json({status: true});
};
