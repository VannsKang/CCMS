//////////////////////////////////////////////////
//
//  nonyang - model.js
//
//  Purpose: MongoDB schema for mongoose
//  Created: 2013.12.11
//
//////////////////////////////////////////////////

// Module dependencies
var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.ObjectId;

// User
exports.User = mongoose.model('user', {
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  recommender: {
    type: ObjectId
  }
});