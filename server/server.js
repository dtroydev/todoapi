/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */

'use strict';

require('colors');

const express = require('express');
const debug = require('debug')('express');

const { ObjectID } = require('./db/mongoose');
const { Todo } = require('./models/todo');
// const { User } = require('./models/user');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const errors = {
  expressHandler(err, _req, res, _next) {
    debug(`Error: ${err.message}, sending ${err.status || 500} status code`.red);
    res.status(err.status || 500).send();
  },
  mongoHandler(op, err) {
    const code = 400;
    debug(`Error: ${err.message}, mongodb operation ${op} failed, sending ${code} status code`.red);
    this.status(code).send(err);
  },
};

// express error handling middleware
app.use(errors.expressHandler);

// todo addition
app.post('/todos', (req, res) => {
  debug(`Received ${req.method}`, req.url, req.body);
  const todo = new Todo({ text: req.body.text });
  todo.save().then(doc => res.send(doc), errors.mongoHandler.bind(res, 'todo.save'));
});

// all todos listing
app.get('/todos', (req, res) => {
  debug(`Received ${req.method}`, req.url);
  Todo.find().then(todos => res.send({ todos }), errors.mongoHandler.bind(res, 'Todo.find()'));
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
    .catch(errors.mongoHandler.bind(res, 'Todo.findById'));
});

// delete route
app.delete('/todos/:id', (req, res) => {
  debug(`Received ${req.method}`, req.url);

  const { id } = req.params;

  if (!ObjectID.isValid(id)) return res.status(404).send();

  return Todo.findByIdAndRemove(id).then((todo) => {
    if (!todo) return res.status(404).send();
    return res.send({ todo });
  })
    .catch(errors.mongoHandler.bind(res, 'Todo.findByIdAndRemove'));
});

// update route
app.patch('/todos/:id', (req, res) => {
  debug(`Received ${req.method}`, req.url, req.body);

  // check id validity
  const { id } = req.params;
  if (!ObjectID.isValid(id)) return res.status(404).send();

  // shorthand
  const { body: doc } = req;

  // validation
  const validFields = ['text', 'completed'];
  const fieldType = f => Todo.schema.path(f).instance.toLowerCase();
  const testInvalid = f => !validFields.includes(f) || `${typeof doc[f]}` !== fieldType(f);
  const fields = Object.keys(doc);
  if (fields.some(testInvalid) || fields.length === 0) return res.status(400).send();

  // completedAt Handling (boolean assured above)
  if (doc.completed === true) doc.completedAt = Date.now();
  if (doc.completed === false) doc.completedAt = null;

  return Todo.findByIdAndUpdate(id, doc).then((todo) => {
    if (!todo) return res.status(404).send();
    return res.send({ todo });
  })
    .catch(errors.mongoHandler.bind(res, 'Todo.findByIdAndUpdate'));
});

const server = app.listen(port, () => {
  debug(`Express server is up on ${port}`);
});

exports.app = app;
exports.server = server;
exports.errors = errors;
