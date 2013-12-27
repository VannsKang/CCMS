//////////////////////////////////////////////////
//
//  CCMS - category.js
//
//  Purpose: To manage category
//  Created: 2013.12.27
//
//////////////////////////////////////////////////

var Category = require('../lib/model.js').Category;

exports.create = function (req, res) {
  var object = {
    'name': req.body.name
  };

  Category(object).save(function (err) {
    if (err) {
      res.send(err);
      throw err;
    }

    console.log('Category added');
    res.send(object);
    return;
  });
};

exports.list = function (req, res) {
  Category.find({}, function (err, categories) {
    if (err) {
      res.send(err);
      return;
    }

    var result = {
      'result': 'success',
      'data': categories
    };

    res.render('category', result);
    return;
  });
};

exports.listAll = function (req, res) {
  Category.find({}, function (err, categories) {
    if (err) {
      res.send(err);
      return;
    }

    var result = {
      'result': 'success',
      'data': categories
    };

    res.send(result);
    return;
  });
};