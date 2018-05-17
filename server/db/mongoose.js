'use strict';

const debug = require('debug')('mongodb');
const mongoose = require('mongoose');
exports.ObjectID = require('mongodb').ObjectID;

const localMongoUri = 'mongodb://localhost:27017/TodoApp';

const mongoUri = process.env.MONGOLAB_URI || localMongoUri;

mongoose.connect(mongoUri, { reconnectTries: 0 })
  .catch(({ message }) => console.log(message));

const db = mongoose.connection;

db.on('disconnected', () => {
  debug('MongoDB Server has Disconnected');
});

db.on('connected', () => {
  debug('MongoDB Server has Connected to', db.host);
});

db.on('error', (err) => {
  debug('MongoDB Server has an Error', err);
});

exports.db = db;
