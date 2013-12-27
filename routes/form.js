//////////////////////////////////////////////////
//
//  CCMS - app.js
//
//  Purpose: Form
//  Created: 2013.12.27
//
//////////////////////////////////////////////////

var User = require('../lib/model.js').User;

exports.login = function (req, res) {
  if ( req.session.user_id ) {
    res.redirect('/form/user');
  } else {
    res.render('loginForm');
  }
};

exports.user = function (req, res) {
  User.findById(req.session.user_id, function (err, user) {
    if (err) {
      res.send(err);
      return;
    }

    var result = {
      'result': 'success',
      'user': user
    };

    res.render('userForm', result);
    return;
  });
};