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


// USERS

exports.users = function (req, res) {
  async.waterfall([
    function (callback) {
      User.find({}, function (err, users) {
        if (err) throw err;

        callback(null, users);
        return;
      });
    },

    function (users, callback) {
      async.map(users, function (user, done) {
        User.findById(user.recommender_id, function (err, recommender) {
          if (err) throw err;

          user.recommender = recommender;
          done(null, user);
          return;
        });
      }, function (err, result) {
        callback(null, users);
        return;
      });
    }
  ], function (err, result) {
    result = {
      'result': 'success',
      'users': result
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

// TRANSACTIONS

exports.transactions = function (req, res) {
  Transaction.find({}, function (err, transactions) {
    if (err) throw err;

    var result = {
      'result': 'success',
      'transactions': transactions
    };

    res.render('admin.transactions.html', result);
    return;
  });
};

exports.transactions = function (req, res) {
  var result = {
    'result': 'success'
  };

  async.waterfall([
    function (callback) {
      // Check pending transaction to user list
      Transaction.find({}, function (err, transactions) {
        if (err) {
          throw err;
        }

        console.log('transactions:', transactions);

        if ( transactions.length === 0 )  {
          callback(null, []);
          // res.render('./transaction/index', result);
          return;
        }

        result.transactions = transactions;

        callback(null, transactions);
        return;
      });
    },

    getNameFromTransactions,

  ], function (err, transactions) {
    if (err) {
      throw err;
    }

    res.render('admin.transactions.html', result);
    return;
  });
};






var getNameFromTransactions = function (transactions, callback) {
  if ( transactions.length === 0 ) {
    callback(null, []);
    return;
  }

  async.map(transactions, function (transaction, mapCallback) {
    async.parallel([
      function getSenderName (done) {
        User.findById(transaction.sender_id, function (err, sender) {
          if (err) {
            throw err;
          }

          transaction.sender = sender;
          done(null);
          return;
        });
      },

      function getReceiverName (done) {
        User.findById(transaction.receiver_id, function (err, receiver) {
          if (err) {
            throw err;
          }

          transaction.receiver = receiver;
          done(null);
          return;
        });
      },

      function getCategoryName (done) {
        Category.findById(transaction.category_id, function (err, category) {
          if (err) {
            throw err;
          }

          transaction.category = category;
          done(null);
          return;
        });
      }
    ], function done (err, result) {
      if (err) {
        throw err;
      }

      mapCallback(null, transaction);
      return;
    });
  }, function mapCallback (err, result) {
    if (err) {
      throw err;
    }

    callback(null, transactions);
    return;
  });
};

