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

var User = require('model').User;
var Transaction = require('model').Transaction;

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

exports.updateWallet = function (req, res) {
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

        callback(null, ( sent[0] ) ? sent[0].sum : 0);
        return;
      });
    },

    function getReceivedTransactions (sentSum, callback) {
      Transaction.aggregate(receivedTransactionQuery, function (err, received) {
        if (err) {
          throw err;
        }

        var receivedSum = ( received[0] ) ? received[0].sum : 0;
        callback(null, receivedSum - sentSum);
        return;
      });
    },

    function updateWallet (summary, callback ) {
      User.findByIdAndUpdate(user_id, { 'wallet': summary }, function (err, user) {
        console.log('user:', user);
        callback(null, user);
        return;
      });
    }
  ], function (err, user) {
    if (err) {
      throw err;
    }
    console.log('user.wallet:', user.wallet);

    result.wallet = user.wallet;
    res.send(result);
    return;
  });
};
