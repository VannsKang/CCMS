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
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  recommender: {
    type: ObjectId
  }
});

exports.Category = mongoose.model('category', {
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
    required: true,
    unique: true
  }
});

exports.Transaction = mongoose.model('transaction', {
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  sender: {
    type: ObjectId,
    required: true
  },
  receiver: {
    type: ObjectId,
    required: true
  },
  category: {
    type: ObjectId,
    required: true
  },
  description: {
    type: String
  },
  amountPoint: {
    type: Number,
    required: true
  }
});