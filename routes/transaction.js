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
var errorHandler = require('../lib/errorHandler');
var util = require('../lib/util');

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

        util.updateWallet(user_id);
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

exports.refusal = function (req, res) {
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
      var permission_check = ( user._id.toString() === transaction.receiver_id.toString() || user._id.toString() === transaction.sender_id.toString() );

      if ( !permission_check ) {
        req.errorHandler.sendErrorMessage('NO_PERMISSION', res);
        return;
      }
      console.log('[user._id]:', user);
      console.log('[transaction._id]:', transaction);

      var findTransaction = {
        $and: [
          { '_id': transaction._id},
          { 'description': transaction.description}
        ]
      };

      Transaction.findOneAndRemove(findTransaction, function (err, transaction) {
        if (err) {
          throw err;
        }
        console.log('transaction:', transaction);

        var result = {
          'result': 'success',
          'deleted': transaction
        };

        util.updateWallet(user_id);
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
    'result': 'success',
    'login': ( user_id ) ? true : false
  };

  async.waterfall([
    function (callback) {
      // Check pending transaction to user list
      Transaction.find({ 'receiver_id': user_id, 'approved': false }, function (err, pendings_to_user) {
        if (err) {
          throw err;
        }

        console.log('pendings_to_user:', pendings_to_user);

        if ( pendings_to_user.length === 0 )  {
          callback(null, []);
          // res.render('./transaction/index', result);
          return;
        }

        result.pendings_to_user = pendings_to_user;

        callback(null, pendings_to_user);
        return;
      });
    },

    getNameFromTransactions,

    function (pendings_to_user, callback) {
      // Check pending transaction from user list
      Transaction.find({ 'sender_id': user_id, 'approved': false }, function (err, pendings_from_user) {
        if (err) {
          throw err;
        }

        console.log('pendings_from_user:', pendings_from_user);

        if ( pendings_from_user.length === 0 )  {
          callback(null, []);
          return;
        }

        result.pendings_from_user = pendings_from_user;

        callback(null, pendings_from_user);
        return;
      });
    },

    getNameFromTransactions

  ], function (err, transactions) {
    if (err) {
      throw err;
    }

    console.log('transaction results:', result);
    // result.transactions = transactions;
    res.render('./transaction/index', result);
    return;
  });
};

exports.personal = function (req, res) {
  var user_id = req.session.user_id;
  if ( !user_id ) {
    return;
  }

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
      Transaction.find({
          $or: [ { 'sender_id': user_id }, { 'receiver_id': user_id } ]
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
          User.findById(req.session.user_id, function (err, user) {

            if (err) {
            res.send(err);
            }

            sender_id = req.session.user_id;
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

  User.findById(user_id, function (err, user) {
    if ( !user ) {
      errorHandler.sendErrorMessage('NO_USER_FOUND', res);
      return;
    }

    if ( !user.wallet ) {
      util.updateWallet(user_id);
    }

    console.log('user:', user);
    result.wallet = user.wallet;
    res.send(result);
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

