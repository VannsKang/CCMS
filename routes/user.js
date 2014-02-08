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
var errorHandler = require('../lib/errorHandler');

exports.list = function (req, res) {
  async.waterfall([
    function (callback) {
      User.find({}, function (err, users) {
        if (err) {
          res.send(err);
          return;
        }

        callback(null, users);
        return;
      });
    },

    function (users, callback) {
      async.map(users, function (user, done) {
        User.findById(user.recommender_id, function (err, recommender) {
          if (err) throw err;

          user.recommender = recommender;
          console.log('recommender:', recommender);
          done(null, user);
          return;
        });
      }, function (err, result) {
        callback(null, users);
        return;
      });
    }
  ], function (err, result) {
    console.log(result[0].recommender);

    result = {
      'result': 'success',
      'users': result
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
  if ( !req.body.recommender ) {
    errorHandler.sendErrorMessage('NO_RECOMMENDER_FOUND', res);
    return;
  }

  async.waterfall([
    function (callback) {
      User.findOne({ 'email': req.body.recommender }, function (err, recommender) {
        if (err) {
          throw err;
        }

        if ( !recommender ) {
          errorHandler.sendErrorMessage('NO_RECOMMENDER_FOUND', res);
          return;
        }

        callback(null, recommender);
        return;
      });
    },

    function (recommender, callback) {
      var object = {
        'name': req.body.name,
        'email': req.body.email,
        'password': encrypt(req.body.password),
        'recommender_id': recommender._id,
        'receive_email': ( req.body.receive_email === 'on' ) ? true : false
      };

      User(object).save(function (err, user) {
        if (err) {
          res.send(err);
          return;
        }

        callback(null, user);
        return;
      });
    }
  ], function (err, result) {
    if (err) {
      throw err;
    }

    result = {
      'result': 'success',
      'data': result
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

  console.log('userInfo:', userInfo);

  User.findOneAndUpdate({ 'email': userInfo.email }, { 'updated_at': new Date() }, function (err, user) {

    if (err) {
      res.send(err);
      return;
    }

    if ( !user ) {
      errorHandler.sendErrorMessage('NO_USER_FOUND', res);
      return;
    }

    if ( !user.approved ) {
      errorHandler.sendErrorMessage('NOT_APPROVED_YET', res);
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

exports.pending = function (req, res) {
  var user_id = req.session.user_id;

  User.find({ 'recommender_id': user_id, 'approved': false }, function (err, users) {
    if (err) throw err;

    console.log('users:', users);

    var result = {
      'result': 'success',
      'pendingRequests': users
    };

    res.render('users.pending.html', result);
    return;
  });
};

exports.approve = function (req, res) {
  var user_id = req.session.user_id;
  var requested_user_id = req.body.requested_user_id;

  async.waterfall([
    function (callback) {
      User.findById(requested_user_id, function (err, user) {
        if (err) throw err;

        if (!user) {
          errorHandler.sendErrorMessage('NO_USER_FOUND', res);
          return;
        }

        if ( user.recommender_id.toString() !== user_id.toString() ) {
          errorHandler.sendErrorMessage('NO_PERMISSION', res);
          return;
        }

        callback(null);
        return;
      });
    },

    function (callback) {
      User.findByIdAndUpdate(requested_user_id, {$set: { 'approved': true, 'updated_at': new Date() } }, function (err, user) {
        if (err) throw err;

        if ( !user ) {
          errorHandler.sendErrorMessage('NO_USER_FOUND', res);
          return;
        }

        callback(null, user);
        return;
      });
    }
  ], function (err, result) {
    result = {
      'result': 'success',
      'user': result
    };

    res.send(result);
    return;
  });
};

exports.logout = function (req, res) {
  req.session.user_id = undefined;

  res.send({ 'result': 'success' });
  return;
};