'use strict';

const debug = require('debug')('mongodb');
const mongoose = require('mongoose');
exports.ObjectID = require('mongodb').ObjectID;

const localMongoUri = 'mongodb://localhost:27017/TodoApp';

const mongoUri = process.env.MONGOLAB_URI || localMongoUri;

const errorHandler = prefix => (err) => {
  debug(`${prefix} ${err}`.red);
  return `${prefix} ${err.message}`;
};

mongoose.connect(mongoUri, { reconnectTries: 0 })
  .catch(errorHandler('mongoose.connect'));

const db = mongoose.connection;

db.on('disconnected', () => {
  debug('Mongoose has been Disconnected');
});

db.on('connected', () => {
  debug('Mongoose has Connected to', db.host);
});

db.on('error', errorHandler('db error event'));

exports.db = db;
exports.errorsMongoose = errorHandler;
