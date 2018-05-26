/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

'use strict';

require('colors');

const debug = require('debug')('express');

const { checkEnv } = require('./config/config');

// check environment, if unrecognised, exit
checkEnv();

const express = require('express');

const { ObjectID } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

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
    this.status(code).send(err.message);
  },
};

const validator = (req, res, schema, validFields) => {
  // shorthand
  const { body: doc } = req;

  // validation - value type mismatches, prohibited/unknown fields, empty objects
  // top level check - nesting not supported
  const testInvalid = (f) => {
    // if not in approved list then invalidate
    if (!validFields.includes(f)) return true;

    // get supplied type
    // match something in => [object something]
    const objTypeRe = /\w+(?=])/;
    const docType = Object.prototype.toString.call(doc[f]).match(objTypeRe)[0];

    // get correct type
    const fieldType = schema.path(f).instance;

    // check if identical
    return docType !== fieldType;
  };

  const fields = Object.keys(doc);

  // returns true if valid
  return !(fields.some(testInvalid) || fields.length === 0);
};

// express error handling middleware
app.use(errors.expressHandler);

// todo addition
app.post('/todos', (req, res) => {
  debug(`Received ${req.method}`, req.url, req.body);

  if (!validator(req, res, Todo.schema, ['text', 'completed'])) return res.status(400).send();
  const todo = new Todo(req.body);
  return todo.save().then(doc => res.send(doc), errors.mongoHandler.bind(res, 'todo.save'));
});

// all todos listing
app.get('/todos', (req, res) => {
  debug(`Received ${req.method}`, req.url);
  Todo.find().then(todos => res.send({ todos }), errors.mongoHandler.bind(res, 'Todo.find'));
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

  if (!validator(req, res, Todo.schema, ['text', 'completed'])) return res.status(400).send();

  // shorthand
  const { body: doc } = req;

  // completedAt Handling (boolean assured above)
  if (doc.completed === true) doc.completedAt = Date.now();
  if (doc.completed === false) doc.completedAt = null;

  return Todo.findByIdAndUpdate(id, doc).then((todo) => {
    if (!todo) return res.status(404).send();
    return res.send({ todo });
  })
    .catch(errors.mongoHandler.bind(res, 'Todo.findByIdAndUpdate'));
});

// user addition
app.post('/users', (req, res) => {
  debug(`Received ${req.method}`, req.url, req.body);
  if (!validator(req, res, User.schema, ['email', 'password'])) return res.status(400).send();
  const user = new User(req.body);
  const token = user.addJWT();
  return user.save().then((doc) => {
    res.header('Authorization', `Bearer ${token}`).send(doc);
  }, errors.mongoHandler.bind(res, 'user.save'));
});

const server = app.listen(port, () => {
  debug(`Express server is up on ${port}`);
});

exports.app = app;
exports.server = server;
exports.errors = errors;
// exports.env = env;
