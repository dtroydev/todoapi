/* eslint func-names: ["error", "never"] */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

'use strict';

const debug = require('debug')('user');
const mongoose = require('mongoose');
const { isEmail } = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { jwtSecret, genSaltRounds } = require('../config/config');

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
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

// doc methods
// add jwt to the user object
userSchema.methods.addJWT = function () {
  const { _id } = this;
  const access = 'auth';

  const payload = { _id, access };

  const token = jwt.sign(payload, jwtSecret);
  this.tokens.push({ access, token });
  return token;
};

// remove jwt from the user object
userSchema.methods.removeJWT = function (token) {
  return this.update({ $pull: { tokens: { token } } })
    .then(({ nModified }) => {
      debug(`Removed ${nModified} token(s) (note: should be 1!)`);
      if (nModified === 0) {
        debug('Token removal failed');
        throw new Error('Token removal failed');
      }
    });
};

// override toJSON to send minimum data in json response
userSchema.methods.toJSON = function () {
  const { _id, email } = this;
  return { _id, email };
};

// model method
userSchema.statics.findByToken = function (token) {
  const access = 'auth';

  // verify jwt
  return jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      // IIFE to bypass eslint param reassign warning
      ((e) => { e.message = `jtw.verify: ${e.message}`; })(err);
      return Promise.reject(err);
    }
    // lookup user in db via id, token and access in jwt payload
    return this.findOne({
      _id: decoded._id,
      tokens: { $elemMatch: { token, access } },
    });
  });
};

// check login
userSchema.statics.findByCredentials = function (email, password) {
  return this.findOne({ email }).then((user) => {
    if (!user) throw new Error('No Such User');
    if (!bcrypt.compareSync(password, user.password)) throw new Error('Wrong Password');
    return user;
  });
};

// doc middleware - presave hook - password hash
userSchema.pre('save', function () {
  // don't hash an already hashed password
  if (!this.isNew) return;
  const salt = bcrypt.genSaltSync(genSaltRounds);
  this.password = bcrypt.hashSync(this.password, salt);
});

exports.User = mongoose.model('User', userSchema);
