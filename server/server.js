'use strict';

const express = require('express');
const debug = require('debug')('express');

require('./db/mongoose');
const { Todo } = require('./models/todo');
// const { User } = require('./models/user');

const app = express();
app.use(express.json());

app.post('/todos', (req, res) => {
  const todo = new Todo({ text: req.body.text });
  todo.save().then(doc => res.send(doc), err => res.status(400).send(err));
});

app.get('/todos', (req, res) => {
  Todo.find().then(todos => res.send({ todos }), err => res.status(400).send(err));
});

const server = app.listen(3000, () => {
  debug('Express server is up on 3000');
});

exports.app = app;
exports.server = server;
