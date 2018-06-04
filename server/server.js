/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

'use strict';

require('colors');

const debug = require('debug')('express');

// check environment, if unrecognised, exit
require('./config/config').checkEnv();
// connect to mongo db
require('./db/mongoose');
const express = require('express');
const { ObjectID } = require('mongodb');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');
const { errors } = require('./middleware/errors');
const { validator } = require('./middleware/validator');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

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

// user login
app.post('/users/login', (req, res) => {
  debug(`Received ${req.method}`, req.url, req.body);

  if (!validator(req, res, User.schema, ['email', 'password'])) return res.status(400).send('empty body / invalid fields');

  const { email, password } = req.body;
  if (Object.keys(req.body).length !== 2 || !email || !password) return res.status(400).send('missing/empty email/password field(s)');
  let token;
  return User.findByCredentials(email, password)
    .then((user) => {
      token = user.addJWT();
      return user.save();
    })
    .then((user) => {
      res.header('Authorization', `Bearer ${token}`).send(user);
    })
    .catch((err) => {
      if (err.name === 'MongoError') return errors.mongoHandler.bind(res, 'user.findByCredentials')(err);
      return res.status(400).send(err.message);
    });
});

// user login
app.delete('/users/me/token', authenticate, (req, res) => {
  debug(`Received ${req.method}`, req.url, req.body);

  if (Object.keys(req.body).length !== 0) return res.status(400).send('unexpected body data');

  const { user, token, error } = res.locals;

  if (error) return res.status(400).send(error);

  return user.removeJWT(token)
    .then(() => user.save())
    .then(() => res.send('ok. token removed. user updated'))
    .catch((err) => {
      if (err.name === 'MongoError') return errors.mongoHandler.bind(res, 'users/logout')(err);
      return res.status(400).send(err.message);
    });
});

// get users/me Route
app.get('/users/me', authenticate, (req, res) => {
  debug(`Received ${req.method}`, req.url, req.body);
  if (res.locals.error) return res.status(400).send(res.locals.error);
  return res.send(res.locals.user);
});

const server = app.listen(port, () => {
  debug(`Express server is up on ${port}`);
});

module.exports = { app, server };
