//////////////////////////////////////////////////
//
//  nonyang - user.js
//
//  Purpose: To manage user account
//  Created: 2013.12.11
//
//////////////////////////////////////////////////

var User = require('../lib/model.js').User;
var encrypt = require('../lib/util.js').encrypt;
var decrypt = require('../lib/util.js').decrypt;

exports.list = function (req, res) {
  User.find({}, function (err, users) {
    if (err) {
      res.send(err);
      return;
    }

    var result = {
      'result': 'success',
      'users': users
    };

    res.render('users', result);
    return;
  });
};

exports.listAll = function (req, res) {
  // if ( !req.session.user_id ) {
  //   var result = {
  //     'result': 'error',
  //     'errno': 'NOT_LOGGED_IN',
  //     'errmsg': '로그인 되어있지 않아요. 먼저 로그인을 하셔야죠'
  //   };
  //   res.send(result);
  //   return;
  // }

  User.find({}, function (err, users) {
    if (err) {
      res.send(err);
      return;
    }

    var result = {
      'result': 'success',
      'data': users
    };

    res.send(result);
    return;
  });
};

exports.create = function (req, res) {
  var object = {
    'name': req.body.name,
    'email': req.body.email,
    'password': encrypt(req.body.password),
    'receive_email': ( req.body.receive_email === 'on' ) ? true : false
  };

  User(object).save(function (err, user) {
    if (err) {
      res.send(err);
      return;
    }

    var result = {
      'result': 'success',
      'data': user
    };

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

    console.log('result:', result);
    res.send(result);
    return;
  });
};

exports.login = function (req, res) {
  var errorHandler = req.errorHandler;

  var userInfo = {
    'email': req.body.email,
    'password': req.body.password
  };

  User.findOneAndUpdate({ 'email': userInfo.email }, { 'updated_at': new Date() }, function (err, user) {

    if (err) {
      res.send(err);
      return;
    }

    if ( !user ) {
      errorHandler.sendErrorMessage('NO_USER_FOUND', res);
      return;
    }

    if ( userInfo.password !== decrypt(user.password) ) {
      errorHandler.sendErrorMessage('PASSWORD_NOT_MATCH', res);
      return;
    }

    req.session.user_id = user._id;

    var result = {
      'result': 'success',
      'data': user
    };

    res.redirect('/');
    return;
  });

};

exports.logout = function (req, res) {
  req.session.user_id = undefined;

  res.send({ 'result': 'success' });
  return;
};