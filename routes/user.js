//////////////////////////////////////////////////
//
//  nonyang - user.js
//
//  Purpose: To manage user account
//  Created: 2013.12.11
//
//////////////////////////////////////////////////

var User = require('../lib/model.js').User;

exports.list = function (req, res) {
  User.find({}, function (err, users) {
    if (err) {
      throw err;
    }

    res.send(users);
    return;
  });
};

exports.create = function (req, res) {
  var object = {
    'name': req.body.name,
    'email': req.body.email,
    'password': req.body.password
  };

  User(object).save(function (err, user) {
    if (err) {
      throw err;
    }

    var result = {
      'result': 'success',
      'data': user
    };

    console.log(result);
    res.send(result);
    return;
  });
};

exports.edit = function (req, res) {
  var object = {
    'name': req.body.name,
    'email': req.body.email,
    'password': req.body.password
  };

  var findQuery = {
    $and: [
      { 'email': req.body.email },
      { 'password': req.body.password }
    ]
  };

  console.log('findQuery:', findQuery);

  var updateQuery = {
    $set: { 'name': req.body.name }
  };

  User.findOneAndUpdate(findQuery, updateQuery, function (err, user) {
    if (err) {
      throw err;
    }

    var result = {
      'result': 'success',
      'data': user
    };

    console.log(result);
    res.send(result);
    return;
  });
};

exports.delete = function (req, res) {
  var findQuery = {
    $and: [
      { 'email': req.body.email },
      { 'password': req.body.password }
    ]
  };

  User.findOneAndRemove(findQuery, function (err, user) {
    if (err) {
      throw err;
    }

    var result = {
      'result': 'success',
      'deleted': user
    };

    res.send(result);
    return;
  });
};