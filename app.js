//////////////////////////////////////////////////
//
//  CCMS - app.js
//
//  Purpose: To create server
//  Created: 2013.12.11
//
//////////////////////////////////////////////////

// Module dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var swig = require('swig');

// Route
var routes = require('./routes');
var user = require('./routes/user');
var form = require('./routes/form');
var category = require('./routes/category');
var transaction = require('./routes/transaction');

// Utilities
var config = require('./config');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.bodyParser());
app.use(express.session());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
  app.set('view cache', false);
  swig.setDefaults({ cache: false });
}

// login check
var loginRequired = function (req, res, next) {
  if ( req.session.user_id === undefined ) {
    res.redirect('/login');
    return;
  }
  req.errorHandler = errorHandler;
  next();
};

mongoose.connect('mongodb://localhost/nonyang');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {

  app.get('/', routes.index);
  app.get('/login', routes.login);

  app.get('/users', user.list);
  app.get('/users/all', user.listAll);
  app.post('/users/create', user.create);
  app.post('/users/edit', user.edit);
  app.post('/users/delete', user.delete);
  app.post('/login', user.login);

  app.get('/form/login', form.login);
  app.get('/form/user', form.user);

  app.post('/category/create', category.create);
  app.get('/category/all', category.listAll);

  app.post('/transaction/create', transaction.create);

  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });

});