//////////////////////////////////////////////////
//
//  nonyang - user.js
//
//  Purpose: To manage user account
//  Created: 2013.12.11
//
//////////////////////////////////////////////////

var User = require('../lib/model.js').User;
var encrypt = require('../lib/util.js').encrypt;
var decrypt = require('../lib/util.js').decrypt;

exports.list = function (req, res) {
  User.find({}, function (err, users) {
    if (err) {
      res.send(err);
      return;
    };

    var result = {
      'result': 'success',
      'users': users
    };

    res.render('users', result);
    return;
  });
};

exports.listAll = function (req, res) {
  User.find({}, function (err, users) {
    if (err) {
      res.send(err);
      return;
    }

    var result = {
      'result': 'success',
      'data': users
    };

    res.send(result);
    return;
  });
};

exports.create = function (req, res) {
  var object = {
    'name': req.body.name,
    'email': req.body.email,
    'password': encrypt(req.body.password),
    'receive_email': ( req.body.receive_email === 'on' ) ? true : false
  };

  User(object).save(function (err, user) {
    if (err) {
      res.send(err);
      return;
    }

    var result = {
      'result': 'success',
      'data': user
    };

    res.send(result);
    return;
  });
};

exports.edit = function (req, res) {  
  User.findById(req.session.user_id, function (err, user) {
    if (err) {
      res.send(err);
      return;
    }

    console.log('user!!:', user);
    console.log('user!!:', user.email);

    var findQuery = {
      $and: [
        { 'email': user.email }
      ]
    };

    var updateQuery = {
      $set: { 
        'name': req.body.name,
        'password': encrypt(req.body.password)
      }
    };    

    User.findOneAndUpdate(findQuery, updateQuery, function (err, user) {
      if (err) {
        throw err;
      }
      console.log('[fixedUser!]:', user);

      var result = {
        'result': 'success',
        'data': user
      };

      console.log(result);
      res.send(result);
      return;
    });

    return;    
  });

  // var findQuery;
  // var findQueryForEmail;

  // User.findById(req.session.user_id, function (err, user) {
  //   if (err) {
  //     res.send(err);
  //     return;
  //   }

  //   console.log('user!!:', user);
  //   console.log('user!!:', user.email);

  //   findQueryForEmail = user.email
  //   return;    
  // });
   
  // User.find({}, function (err, users) {
  //   if(err) {
  //     res.send(err);
  //     return;
  //   };

  //   console.log('[users]:', users);
  //   return;
  // });

  // var findQuery = {
  //   $and: [
  //     { 'email': req.body.email }
  //   ]
  // };

  // console.log('findQuery!!!:', findQueryForEmail);

  // var updateQuery = {
  //   $set: { 
  //     'name': req.body.name,
  //     'password': encrypt(req.body.password)
  //   }
  // };

  // User.findOneAndUpdate(findQuery, updateQuery, function (err, user) {
  //   if (err) {
  //     throw err;
  //   }
  //   // console.log('[fixedUser!]:', user);

  //   var result = {
  //     'result': 'success',
  //     'data': user
  //   };

  //   console.log(result);
  //   res.send(result);
  //   return;
  // });

};

exports.editForm = function (req, res) {

  User.findById(req.session.user_id, function (err, user) {
    if (err) {
      res.send(err);
      return;
    };
    console.log('user!!!:', user);
    console.log('[req.session.user_id]:', req.session.user_id)

    var result = {
      'result': 'success',
      'users': user
    };

    res.render('editForm', result);
    return;

  })

};

exports.delete = function (req, res) {
  var findQuery = {
    $and: [
      { 'email': req.body.email },
      { 'password': req.body.password }
    ]
  };

  User.findOneAndRemove(findQuery, function (err, user) {
    if (err) {
      throw err;
    }

    var result = {
      'result': 'success',
      'deleted': user
    };

    console.log('result:', result);
    res.send(result);
    return;
  });
};

exports.login = function (req, res) {
  var errorHandler = req.errorHandler;

  var userInfo = {
    'email': req.body.email,
    'password': req.body.password
  };

  User.findOneAndUpdate({ 'email': userInfo.email }, { 'updated_at': new Date() }, function (err, user) {

    if (err) {
      res.send(err);
      return;
    }

    if ( !user ) {
      errorHandler.sendErrorMessage('NO_USER_FOUND', res);
      return;
    }

    if ( userInfo.password !== decrypt(user.password) ) {
      errorHandler.sendErrorMessage('PASSWORD_NOT_MATCH', res);
      return;
    }

    req.session.user_id = user._id;

    var result = {
      'result': 'success',
      'data': user
    };

    res.redirect('/');
    return;
  });

};

exports.logout = function (req, res) {
  req.session.user_id = undefined;

  res.send({ 'result': 'success' });
  return;
};