//////////////////////////////////////////////////
//
//  nonyang - index.js
//
//  Purpose: Index route
//  Created: 2013.12.11
//
//////////////////////////////////////////////////

exports.index = function (req, res) {
  var renderObject = {
    title: 'CCMS',
    login: ( req.session.user_id ) ? true : false
  };

  res.render('index', renderObject);
};

exports.login = function (req, res) {
  res.render('login');
};