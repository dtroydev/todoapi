'use strict';

const debug = require('debug')('auth');
const { User } = require('../models/user');
const { errors } = require('../middleware/errors');

const authenticate = (req, res, next) => {
  debug(`Authentication on: ${req.method}`, req.url, req.body);
  const header = req.header('Authorization');
  if (header === undefined) {
    debug('missing authorisation header'.red);
    return res.status(400).send('missing authorisation header');
  }
  // check authorization header basic format
  const re = /^Bearer ([\w_-]+\.[\w_-]+\.[\w_-]+)$/;
  const authHeaderCheck = header.match(re);
  if (authHeaderCheck === null) {
    debug('malformed authorisation header'.red);
    return res.status(400).send('malformed authorisation header');
  }
  const token = authHeaderCheck[1];

  // additional token checks and verification, followed by db lookup
  return User.findByToken(token).then((doc) => {
    // id not found in db
    if (!doc) {
      debug('User Not Found'.red);
      return res.status(404).send();
    }
    res.locals.user = doc;
    res.locals.token = token;
    debug('User found'.green);
    return next();
  }, errors.mongoHandler.bind(res, 'User.findByToken'));
};

exports.authenticate = authenticate;
