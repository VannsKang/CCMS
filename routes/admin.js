//////////////////////////////////////////////////
//
//  CCMS - admin.js
//
//  Purpose: For administrator only
//  Created: 2013.12.28
//
//////////////////////////////////////////////////

// Module Dependencies
var async = require('async');
var config = require('../config');

// Models
var User = require('../lib/model.js').User;
var Category = require('../lib/model.js').Category;
var Transaction = require('../lib/model.js').Transaction;

// Utilities
var ObjectId = require('mongoose').Types.ObjectId;
var errorHandler = require('../lib/errorHandler');
var util = require('../lib/util');

exports.users = function (req, res) {
  User.find({}, function (err, users) {
    if (err) throw err;

    var result = {
      'result': 'success',
      'users': users
    };

    res.render('admin.users.html', result);
    return;
  });
};

exports.usersApproval = function (req, res) {
  User.findByIdAndUpdate(req.body.user_id, { 'approved': true }, function (err, user) {
    if (err) throw err;

    if ( !user ) {
      errorHandler.sendErrorMessage('NO_USER_FOUND', res);
      return;
    }

    var result = {
      'result': 'success',
      'user': user
    };

    res.send(result);
    return;
  });
};