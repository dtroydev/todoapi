/* eslint func-names: ["error", "never"] */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

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

userSchema.statics.findByToken = function (token) {
  const access = 'auth';

  // verify jwt
  return jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      const cErr = err; // to avoid param reassign eslint warning
      cErr.message = `jtw.verify: ${cErr.message}`;
      return Promise.reject(cErr);
    }
    // lookup user in db via id, token and access in jwt payload
    return this.findOne({
      _id: decoded._id,
      tokens: { $elemMatch: { token, access } },
    });
  });
};

exports.User = mongoose.model('User', userSchema);
