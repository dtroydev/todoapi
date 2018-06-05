'use strict';

const debug = require('debug')('authenticate');
const { User } = require('../models/user');
const { errors } = require('../middleware/errors');

const extractToken = (req) => {
  const header = req.header('Authorization');
  if (header === undefined) {
    debug('missing authorisation header');
    return { error: 'missing authorisation header' };
    // return res.status(400).send('missing authorisation header');
  }
  // check authorization header basic format
  const re = /^Bearer ([\w_-]+\.[\w_-]+\.[\w_-]+)$/;
  const authHeaderCheck = header.match(re);
  if (authHeaderCheck === null) {
    debug('malformed authorisation header');
    return { error: 'malformed authorisation header' };
    // return res.status(400).send('malformed authorisation header');
  }
  return { token: authHeaderCheck[1] };
};

const authenticate = (req, res, next) => {
  debug(`Authentication on: ${req.method}`, req.url, req.body);

  const { error, token } = extractToken(req);

  if (error) {
    res.locals.error = error;
    return next();
  }

  // should have token defined at this point.
  return User.findByToken(token).then((user) => {
    // id not found in db
    if (!user) {
      debug('Token Not Found');
      res.locals.error = 'Token Not Found';
      return next();
    }
    res.locals.user = user;
    res.locals.token = token;
    debug('Token Found');
    return next();
  }, errors.mongoHandler.bind(res, 'User.findByToken'));
};

module.exports = { authenticate };
