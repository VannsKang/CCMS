//////////////////////////////////////////////////
//
//  nonyang - util.js
//
//  Purpose: Utility Methods
//  Created: 2013.12.27
//
//////////////////////////////////////////////////

var config = require('../config');
var crypto = require('crypto');
var async = require('async');

var User = require('./model').User;
var Transaction = require('./model').Transaction;

var ObjectId = require('mongoose').Types.ObjectId;

exports.encrypt = function (input) {
  // 암호화
  var cipher = crypto.createCipher('aes192', config.encryption.key);
  cipher.update(input, 'utf8', 'base64');
  var encrypted = cipher.final('base64');

  return encrypted;
};

exports.decrypt = function (input) {
  // 암호화 해제
  var decipher = crypto.createDecipher('aes192', config.encryption.key);
  decipher.update(input, 'base64', 'utf8');
  var decrypted = decipher.final('utf8');

  return decrypted;
};

exports.updateWallet = function (user_id) {
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
      $group: { _id: null, sum: { $sum: '$amountPoint' }, count: { $sum: 1 } }
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
      $group: { _id: null, sum: { $sum: '$amountPoint' }, count: { $sum: 1 } }
    }
  ];

  async.waterfall([
    function getSentTransactions (callback) {
      Transaction.aggregate(sentTransactionQuery, function (err, sent) {
        if (err) {
          throw err;
        }

        console.log('sent:', sent);

        var sentSum = ( sent[0] ) ? sent[0].sum : 0;
        var sentCount = ( sent[0] ) ? sent[0].count : 0;

        callback(null, sentSum, sentCount);
        return;
      });
    },

    function getReceivedTransactions (sentSum, sentCount, callback) {
      Transaction.aggregate(receivedTransactionQuery, function (err, received) {
        if (err) {
          throw err;
        }

        console.log('received:', received);

        var receivedSum = ( received[0] ) ? received[0].sum : 0;
        var receivedCount = ( received[0] ) ? received[0].count : 0;

        callback(null, receivedSum - sentSum, receivedCount + sentCount);
        return;
      });
    },

    function updateWallet (summary, count, callback ) {
      User.findByIdAndUpdate(user_id, { $set: { 'updated_at': new Date(), 'wallet': summary, 'count': count } }, function (err, user) {
        console.log('user:', user);
        callback(null, user);
        return;
      });
    }
  ], function (err, user) {
    if (err) {
      throw err;
    }

    console.log('updateDone');
    return;
  });
};

exports.updateAllWallets = function (req, res) {
  async.waterfall([
    function (callback) {
      User.find({}, function (err, users) {
        if (err) {
          throw err;
        }

        if ( !users ) {
          throw err;
        }

        callback(null, users);
      });
    },

    function (users, callback) {
      async.map(users, function (user, done) {
        // QUERY
        var sentTransactionQuery = [
          {
            $match: {
              'sender_id': user._id,
              'approved': true
            }
          },
          {
            $group: { _id: null, sum: { $sum: '$amountPoint' }, count: { $sum: 1 } }
          }
        ];
        var receivedTransactionQuery = [
          {
            $match: {
              'receiver_id': user._id,
              'approved': true
            }
          },
          {
            $group: { _id: null, sum: { $sum: '$amountPoint' }, count: { $sum: 1 } }
          }
        ]; // QUERY

        async.waterfall([
          function getSentTransactions (callback) {
            Transaction.aggregate(sentTransactionQuery, function (err, sent) {
              if (err) {
                throw err;
              }

              console.log('sent:', sent);

              var sentSum = ( sent[0] ) ? sent[0].sum : 0;
              var sentCount = ( sent[0] ) ? sent[0].count : 0;

              callback(null, sentSum, sentCount);
              return;
            });
          },

          function getReceivedTransactions (sentSum, sentCount, callback) {
            Transaction.aggregate(receivedTransactionQuery, function (err, received) {
              if (err) {
                throw err;
              }

              console.log('received:', received);

              var receivedSum = ( received[0] ) ? received[0].sum : 0;
              var receivedCount = ( received[0] ) ? received[0].count : 0;

              callback(null, receivedSum - sentSum, receivedCount + sentCount);
              return;
            });
          },

          function updateWallet (summary, count, callback ) {
            User.findByIdAndUpdate(user._id, { $set: { 'updated_at': new Date(), 'wallet': summary, 'count': count } }, function (err, user) {
              console.log('user:', user);
              callback(null, user);
              return;
            });
          }
        ], function (err, user) {
          if (err) {
            throw err;
          }

          done(null);
          return;
        });

      }, function (err, result) {
        callback(null);
        return;
      });
    }
  ], function (err, result) {
    console.log('done');
    res.send('done');
    return;
  });
};
