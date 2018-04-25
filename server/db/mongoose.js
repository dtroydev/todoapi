'use strict';

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/TodoApp', { reconnectTries: 0 })
  .catch(err => console.log(err.message));

const db = mongoose.connection;

db.on('disconnected', () => {
  console.log('MongoDB Server has Disconnected');
});

db.on('connected', () => {
  console.log('MongoDB Server has Connected');
});

exports.mongoose = mongoose;
