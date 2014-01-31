//////////////////////////////////////////////////
//
//  nonyang - ranking.js
//
//  Purpose: To manage ranking and statistics
//  Created: 2013.12.11
//
//////////////////////////////////////////////////

// Module dependencies
var async = require('async');

// Models
var Transaction = require('../lib/model.js').Transaction;
var User = require('../lib/model.js').User;

exports.tradeRank = function (req, res) {
  async.waterfall([
    function (callback) {
      var aggregateQuery = [
        { $match:
          {
            'approved': true
          }
        },
        { $group:
          {
            '_id': '$receiver_id',
            'transactions': { $sum: 1 },
            'amountPoint': { $sum: '$amountPoint' }
          }
        },
        { $sort:
          {
            'transactions': -1,
            'amountPoint': -1
          }
        }
      ];

      Transaction.aggregate(aggregateQuery, function (err, ranks) {
        if (err) throw err;

        console.log('tradeRanks:', ranks);
        callback(null, ranks);
        return;
      });
    },

    function (ranks, callback) {
      async.map(ranks, function (rank, done) {
        User.findById(rank._id, function (err, user) {
          if (err) throw err;
          console.log('user:', user);

          rank.user = user;
          done(null);
          return;
        });
      }, function (err, result) {
        if (err) throw err;

        callback(null, ranks);
        return;
      });
    }
  ], function (err, result) {
    if (err) throw err;

    result = {
      'result': 'success',
      'ranks': result
    };

    console.log('result:', result);
    res.render('./ranking/tradeRank', result);
    return;
  });
};

exports.nonyangRank = function (req, res) {
  async.waterfall([
    function (callback) {
      var aggregateQuery = [
        { $match:
          {
            'approved': true
          }
        },
        { $group:
          {
            '_id': '$receiver_id',
            'transactions': { $sum: 1 },
            'amountPoint': { $sum: '$amountPoint' }
          }
        },
        { $sort:
          {
            'amountPoint': -1,
            'transactions': -1
          }
        }
      ];

      Transaction.aggregate(aggregateQuery, function (err, ranks) {
        if (err) throw err;

        console.log('ranks:', ranks);
        callback(null, ranks);
        return;
      });
    },

    function (ranks, callback) {
      async.map(ranks, function (rank, done) {
        User.findById(rank._id, function (err, user) {
          if (err) throw err;
          console.log('user:', user);

          rank.user = user;
          done(null);
          return;
        });
      }, function (err, result) {
        if (err) throw err;

        callback(null, ranks);
        return;
      });
    }

  ], function (err, result) {
    if (err) throw err;

    result = {
      'result': 'success',
      'ranks': result
    };

    console.log('result:', result);
    res.render('./ranking/nonyangRank', result);
    return;
  });
};