'use strict';

const debug = require('debug')('mongodb');
const mongoose = require('mongoose');
exports.ObjectID = require('mongodb').ObjectID;

const errorHandler = prefix => (err) => {
  debug(`${prefix} ${err}`.red);
  return `${prefix} ${err.message}`;
};

mongoose.connect(process.env.MONGOURI, { reconnectTries: 0 })
  .catch(errorHandler('mongoose.connect'));

const db = mongoose.connection;

db.on('disconnected', () => {
  debug('Mongoose has been Disconnected from DB server');
});

db.on('connected', () => {
  debug('Mongoose has Connected to DB server:', db.host);
});

db.on('error', errorHandler('db error event'));

exports.db = db;
exports.errorsMongoose = errorHandler;
