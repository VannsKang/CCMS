//////////////////////////////////////////////////
//
//  CCMS - transaction.js
//
//  Purpose: To manage transaction records
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

exports.approve = function (req, res) {
  var user_id = req.session.user_id;
  var transaction_id = req.body.transaction_id;

  async.waterfall([
    function getUser (callback) {
      User.findById(user_id, function (err, user) {
        if (err) {
          throw err;
        }

        if ( !user ) {
          req.errorHandler.sendErrorMessage('NO_USER_FOUND', res);
          return;
        }

        callback(null, user);
        return;
      });
    },

    function getTransaction (user, callback) {
      Transaction.findById(transaction_id, function (err, transaction) {
        if (err) {
          throw err;
        }

        if ( !transaction ) {
          req.errorHandler.sendErrorMessage('NO_TRANSACTION', res);
          return;
        }

        callback(null, user, transaction);
        return;
      });
    },

    function compareUserToTransaction (user, transaction, callback) {
      if ( user._id.toString() !== transaction.receiver_id.toString() ) {
        req.errorHandler.sendErrorMessage('NO_PERMISSION', res);
        return;
      }

      updateObject = {
        $set: {
          'updated_at': new Date(),
          'approved': true
        }
      };

      Transaction.findByIdAndUpdate(transaction._id, updateObject, function (err, transaction) {
        if (err) {
          throw err;
        }

        var result = {
          'result': 'success',
          'transaction': transaction
        };

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

exports.list = function (req, res) {
  var user_id = req.session.user_id;
  var result = {
    'result': 'success'
  };

  async.waterfall([
    function (callback) {
      // Check pending transaction list
      Transaction.find({ 'receiver_id': user_id, 'approved': false }, function (err, transactions) {
        if (err) {
          throw err;
        }

        console.log('transactions:', transactions);

        if ( transactions.length === 0 )  {
          result.transactions = transactions;
          res.render('./transaction/index', result);
          return;
        }

        callback(null, transactions);
        return;
      });
    },
    getNameFromTransactions
  ], function (err, transactions) {
    if (err) {
      throw err;
    }
    result.transactions = transactions;
    res.render('./transaction/index', result);
    return;
  });
};

exports.personal = function (req, res) {
  var result = {
    'result': 'success'
  };

  var limit = config.options.documentsPerPages || 10;
  var skip = Number(req.query.skip) * limit || 0;

  var queryOption = {
    'skip': skip,
    'limit': limit,
    'sort': { 'updated_at': -1 }
  };

  var user_id = req.session.user_id;

  async.waterfall([
    function (callback) {
      Transaction.find({
          $or: [ { 'sender_id': user_id }, { 'receiver_id': user_id } ],
         'approved': true
       }, null, queryOption, function (err, transactions) {
        if (err) {
          throw err;
        }

        if ( transactions.length === 0 )  {
          result.personalTransactions = transactions;
          res.render('./transaction/personal', result);
          return;
        }

        callback(null, transactions);
        return;
      });
    },
    getNameFromTransactions
  ], function (err, transactions) {
    if (err) {
      throw err;
    }
    result.personalTransactions = transactions;
    res.render('./transaction/personal', result);
    return;
  });
};

exports.public = function (req, res) {
  var result = {
    'result': 'success'
  };

  var limit = config.options.documentsPerPages || 10;
  var skip = Number(req.query.skip) * limit || 0;

  var queryOption = {
    'skip': skip,
    'limit': limit,
    'sort': { 'updated_at': -1 }
  };

  async.waterfall([
    function (callback) {
      Transaction.find({ 'approved': true }, null, queryOption, function (err, transactions) {
        if (err) {
          throw err;
        }

        if ( transactions.length === 0 )  {
          result.personalTransactions = transactions;
          res.render('./transaction/public', result);
          return;
        }

        callback(null, transactions);
        return;
      });
    },
    getNameFromTransactions
  ], function (err, transactions) {
    if (err) {
      throw err;
    }

    result.publicTransactions = transactions;
    res.render('./transaction/public', result);
    return;
  });

};

exports.create = function (req, res) {
  var sender_id, receiver_id, category_id;

  async.waterfall([
    // Stream #1: Sender / Reciever Validation
    function (callback) {
      async.parallel([
        // Branch #1: Validate sender
        function (done) {
          User.findOne({ 'name': req.body.sender }, function (err, user) {
            if (err) {
              throw err;
            }
            sender_id = user._id;
            done(null);
            return;
          });
        },
        // Branch #2: Validate receiver
        function (done) {
          User.findOne({ 'name': req.body.receiver }, function (err, user) {
            if (err) {
              throw err;
            }

            if (!user) {
              return;
            }

            receiver_id = user._id;
            done(null);
            return;
          });
        }
      ], function (err, result) {
        if (err) {
          throw err;
        }
        // Stem: Check transaction to self
        if ( sender_id.toString() === receiver_id.toString() ) {
          console.log('SELF_TRANSACTION_ERROR');
          req.errorHandler.sendErrorMessage('SELF_TRANSACTION_ERROR', res);
          return;
        }
        console.log('result:', result);
        callback(null);
        return;
      });
    },

    function (callback) {
      Category.findOne({ 'name': req.body.category }, function (err, category) {
        if (err) {
          throw err;
        }
        console.log('req.body.category:', req.body.category);
        console.log('category:', category);

        if (category.length === 0) {
          var object = {
            'name': req.body.category
          };
          Category(object).save(function (err, newCategory) {
            if (err) {
              throw err;
            }
            category_id = newCategory._id;
            console.log('Category created:', category_id);
            callback(null);
            return;
          });
        }

        category_id = category._id;
        console.log('Category exists:', category_id);
        callback(null);
        return;
      });
    },

    function (callback) {
      var transactionObject = {
        'sender_id': sender_id,
        'receiver_id': receiver_id,
        'category_id': category_id,
        'description': req.body.description,
        'amountPoint': req.body.amountPoint
      };
      Transaction(transactionObject).save(function (err) {
        if (err) {
          throw err;
        }

        console.log(err);
        callback(null);
        return;
      });
    }

  ], function (err, result) {
    if (err) {
      throw err;
    }
    console.log('Transaction created succesfully');
    res.redirect('/');
    return;
  });

};

exports.count = function (req, res) {
  var user_id = req.session.user_id;
  var result = {
    'result': 'success'
  };

  var sentTransactionQuery = [
    {
      $match: {
        'sender_id': ObjectId(user_id),
        'approved': true
      }
    },
    {
      $group: { _id: null, sum: { $sum: '$amountPoint' } }
    }
  ];

  var receivedTransactionQuery = [
    {
      $match: {
        'receiver_id': ObjectId(user_id),
        'approved': true
      }
    },
    {
      $group: { _id: null, sum: { $sum: '$amountPoint' } }
    }
  ];

  async.waterfall([
    function getSentTransactions (callback) {
      Transaction.aggregate(sentTransactionQuery, function (err, sent) {
        if (err) {
          throw err;
        }

        callback(null, sent[0].sum);
        return;
      });
    },

    function getReceivedTransactions (sentSum, callback) {
      Transaction.aggregate(receivedTransactionQuery, function (err, received) {
        if (err) {
          throw err;
        }

        callback(null, received[0].sum - sentSum);
        return;
      });
    }
  ], function (err, totalAmount) {
    if (err) {
      throw err;
    }
    console.log('totalAmount:', totalAmount);

    result.wallet = totalAmount;
    res.send(result);
    return;
  });
};

var getNameFromTransactions = function (transactions, callback) {
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