//////////////////////////////////////////////////
//
//  nonyang - index.js
//
//  Purpose: Index route
//  Created: 2013.12.11
//
//////////////////////////////////////////////////

var User = require('../lib/model.js').User;

// exports.index = function (req, res) {

//   var renderObject = {
//     title: 'CCMS',
//     login: ( req.session.user_id ) ? true : false
//   };
  
//   res.render('index', renderObject);
// 	return;
// };	

exports.index = function (req, res) {
	User.findById(req.session.user_id, function (err, user) {
    if (err) {
      res.send(err);
      return;
    }

    console.log('user!!!!!:',user);
    console.log('req.session!!!!:', req.session.user_id)
    // console.log('[req.session]:',req.session.user_id)
    var renderObject = {      
      'result': 'success',
      'user': user,
 			'title': 'CCMS',
    	'login': ( req.session.user_id ) ? true : false      
    };

		console.log('renderObject:', renderObject);	

		res.render('index', renderObject);
  	return;		    
  });
	
};

  
exports.login = function (req, res) {
  res.render('login');
};

