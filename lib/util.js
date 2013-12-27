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