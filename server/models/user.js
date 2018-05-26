/* eslint func-names: ["error", "never"] */

'use strict';

const mongoose = require('mongoose');
const { isEmail } = require('validator');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 6,
    unique: true,
    validate: {
      validator: isEmail,
      message: '{VALUE} is not a valid email!',
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  tokens: [
    {
      _id: false,
      access: {
        type: String,
        required: true,
      },
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

// add jwt to the user object
userSchema.methods.addJWT = function () {
  const { _id } = this;
  const access = 'auth';

  const payload = { _id, access };

  const token = jwt.sign(payload, jwtSecret);
  this.tokens.push({ access, token });
  return token;
};

// override toJSON to send minimum data in json response
userSchema.methods.toJSON = function () {
  const { _id, email } = this;
  return { _id, email };
};

exports.User = mongoose.model('User', userSchema);
