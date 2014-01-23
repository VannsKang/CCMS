//////////////////////////////////////////////////
//
//  nonyang - user.js
//
//  Purpose: To manage user account
//  Created: 2013.12.11
//
//////////////////////////////////////////////////

// Module Dependencies
var async = require('async');
var config = require('../config');

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
  var findQuery;
  var updateQuery;
  var reqOriginalPassword;
  var reqLoginPassword;

  async.waterfall([
    function getLoginUser (callback) {
      User.findById(req.session.user_id, function (err, user) {
        if (err) {
          res.send(err);
          return;
        }

        reqOriginalPassword = req.body.originalPassword;
        reqLoginPassword = decrypt(user.password);

        findQuery = {
          $and: [
            { 'email': user.email }
          ]
        };

        updateQuery = {
          $set: {
            'name': req.body.name,
            'password': encrypt(req.body.password)
          }
        };

        callback(null, user);
        return;
      });
    },
    function verifiedPassword (user, callback) {
      if (reqOriginalPassword !== reqLoginPassword) {
        console.log('notMatchedPassword!');
        res.redirect('/editForm');
        return;
      }

      callback(null, user);
      return;
    },
    function updateUser (user, callback) {
      User.findOneAndUpdate(findQuery, updateQuery, function (err, user) {
        if (err) {
          throw err;
        }

        console.log('[fixedUser!]:', user);

        var result = {
          'result': 'success',
          'data': user
        };

        console.log(result);
        callback(null, result);
        return;
      });
    }
  ], function (err, result) {
    if (err) {
      throw err;
    }

    res.send(result);
    return;
  });
};

exports.editForm = function (req, res) {
  User.findById(req.session.user_id, function (err, user) {
    if (err) {
      res.send(err);
      return;
    }

    var result = {
      'result': 'success',
      'users': user
    };

    res.render('editForm', result);
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
      req.errorHandler.sendErrorMessage('NO_USER_FOUND', res);
      return;
    }

    if ( userInfo.password !== decrypt(user.password) ) {
      req.errorHandler.sendErrorMessage('PASSWORD_NOT_MATCH', res);
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