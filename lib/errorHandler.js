var HashMap = require('hashmap').HashMap;
// var LOGGER = require('./LOGGER');

var map;

var init = function() {
  map = new HashMap();

  // parameter 이상
  map.set('SELF_TRANSACTION_ERROR', 'Dude. You know you can\'t transfer to yourself.');
  map.set('NO_RECOMMENDER_FOUND', 'You must enter recommender email to sign up.');
  map.set('PASSWORD_NOT_MATCH', 'Password does not match to your account');
};

var err_msg = function(err_code) {
  if ( map === undefined ) {
    init();
  }
  var err_msg = map.get(err_code);
  if (err_msg === undefined) {
    err_msg = err_code + '는 등록되지 않은 에러코드입니다.';
    // LOGGER.log(LOGGER.CRITICAL_LOG, 'ERROR_CODE.err_msg()', 'SYSTEM', err_msg);
  }
  return err_msg;
};

exports.getErrorMessage = function(err_code) {
  return err_msg(err_code);
};

exports.sendErrorMessage = function(err_code, res) {
  var result = {
    'result' : 'fail',
    'err_code' : err_code,
    'err_msg' : err_msg(err_code)
  };
  // LOGGER.log(LOGGER.REQRES_LOG, 'ERROR_CODE.sendErrMsg()', 'SYSTEM', 'fail, err_code : ' + err_code + ', err_msg : ' + err_msg(err_code));
  console.log('err_msg:', err_msg(err_code));
  res.send(500, err_msg(err_code));
};

exports.sendExceptionMessage = function(exception, res) {
  var result = {
    'result' : 'fail',
    'err_code' : 'EXCEPTION',
    'err_msg' : exception
  };
  // LOGGER.log(LOGGER.CRITICAL_LOG, 'ERROR_CODE.sendExceptionMessage()', 'SYSTEM', 'EXCEPTION : ' + exception.stack);
  res.send(result);
};