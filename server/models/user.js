'use strict';

const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
  },
});

exports.User = mongoose.model('User', userSchema);
