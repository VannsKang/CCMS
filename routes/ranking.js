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
        { $group:
          {
            '_id': '$_id',
            'wallet': { $sum: '$wallet' },
            'count': { $sum: '$count' }
          }
        },
        { $sort:
          {
            'count': 1,
            'wallet': -1
          }
        }
      ];

      User.aggregate(aggregateQuery, function (err, ranks) {
        if (err) throw err;

        callback(null, ranks);
        return;
      });
    },

    function (ranks, callback) {
      async.map(ranks, function (rank, done) {
        User.findById(rank._id, function (err, user) {
          if (err) throw err;

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

    console.log('trade-result:', result);
    res.render('./ranking/tradeRank', result);
    return;
  });
};

exports.nonyangRank = function (req, res) {
  async.waterfall([
    function (callback) {
      var aggregateQuery = [
        { $group:
          {
            '_id': '$_id',
            'wallet': { $sum: '$wallet' },
            'count': { $sum: '$count' }
          }
        },
        { $sort:
          {
            'wallet': -1,
            'count': -1
          }
        }
      ];

      User.aggregate(aggregateQuery, function (err, ranks) {
        if (err) throw err;

        callback(null, ranks);
        return;
      });
    },

    function (ranks, callback) {
      async.map(ranks, function (rank, done) {
        User.findById(rank._id, function (err, user) {
          if (err) throw err;

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

    console.log('nonyang-result:', result);
    res.render('./ranking/nonyangRank', result);
    return;
  });
};