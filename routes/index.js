//////////////////////////////////////////////////
//
//  nonyang - index.js
//
//  Purpose: Index route
//  Created: 2013.12.11
//
//////////////////////////////////////////////////

exports.index = function (req, res){
  res.render('index', { title: 'Express' });
};

exports.login = function (req, res) {
  res.render('login', { title: 'Express' });
};