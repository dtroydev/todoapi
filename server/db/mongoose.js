'use strict';

const debug = require('debug')('mongodb');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/TodoApp', { reconnectTries: 0 })
  .catch(err => console.log(err.message));

const db = mongoose.connection;

db.on('disconnected', () => {
  debug('MongoDB Server has Disconnected');
});

db.on('connected', () => {
  debug('MongoDB Server has Connected');
});

// exports.mongoose = mongoose;
exports.db = db;
