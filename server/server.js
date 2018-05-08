'use strict';

const express = require('express');
const debug = require('debug')('express');

const { ObjectID } = require('./db/mongoose');
const { Todo } = require('./models/todo');
// const { User } = require('./models/user');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// todo addition
app.post('/todos', (req, res) => {
  debug(`Received ${req.method}`, req.url, req.body);
  const todo = new Todo({ text: req.body.text });
  todo.save().then(doc => res.send(doc), err => res.status(400).send(err));
});

// all todos listing
app.get('/todos', (req, res) => {
  debug(`Received ${req.method}`, req.url);
  Todo.find().then(todos => res.send({ todos }), err => res.status(400).send(err));
});

// single todo listing
app.get('/todos/:id', (req, res) => {
  debug(`Received ${req.method}`, req.url);

  const { id } = req.params;

  if (!ObjectID.isValid(id)) return res.status(404).send();

  return Todo.findById(id).then((todo) => {
    if (!todo) return res.status(404).send();
    return res.send({ todo });
  })
    .catch(() => res.status(400).send());
});

app.delete('/todos/:id', (req, res) => {
  debug(`Received ${req.method}`, req.url);

  const { id } = req.params;

  if (!ObjectID.isValid(id)) return res.status(404).send();

  return Todo.findByIdAndRemove(id).then((todo) => {
    if (!todo) return res.status(404).send();
    return res.send({ todo });
  })
    .catch(() => res.status(400).send());
});

const server = app.listen(port, () => {
  debug(`Express server is up on ${port}`);
});

exports.app = app;
exports.server = server;
