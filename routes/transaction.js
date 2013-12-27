//////////////////////////////////////////////////
//
//  CCMS - transaction.js
//
//  Purpose: To manage transaction records
//  Created: 2013.12.28
//
//////////////////////////////////////////////////

var async = require('async');

var User = require('../lib/model.js').User;
var Category = require('../lib/model.js').Category;
var Transaction = require('../lib/model.js').Transaction;

exports.create = function (req, res) {

  var sender_id, receiver_id, category_id;

  async.waterfall([
    // Stream #1: Sender / Reciever Validation
    function (callback) {
      async.parallel([
        // Branch #1: Validate sender
        function (done) {
          User.findOne({'name': req.body.sender}, function (err, user) {
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
          User.findOne({'name': req.body.receiver}, function (err, user) {
            if (err) {
              throw err;
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
          req.errorHandler.sendErrMsg('TRANSACTION_TO_SELF', res);
          return;
        }
        console.log('result:', result);
        callback(null);
        return;
      });
    },

    function (callback) {
      Category.findOne({'name': req.body.category}, function (err, category) {
        if (err) {
          throw err;
        }

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
        'sender': sender_id,
        'receiver': receiver_id,
        'category': category_id,
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