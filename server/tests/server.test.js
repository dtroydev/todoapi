/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

'use strict';

const request = require('supertest');
const expect = require('expect');
const debug = require('debug')('express');
const { app, server } = require('../server');
const { Todo } = require('../models/todo');
const { ObjectID, db } = require('../db/mongoose');

// test data
const testTodos = [
  { _id: new ObjectID(), text: 'test todo #1' },
  { _id: new ObjectID(), text: 'test todo #2' },
];

// populate with test data
beforeEach((done) => {
  Todo.deleteMany()
    .then(() => Todo.insertMany(testTodos))
    .then(() => done())
    .catch(done);
});

describe('Test Suite: POST /todos', () => {
  it('should create a new todo', (done) => {
    const text = 'lorem ipsum mofo';
    request(app)
      .post('/todos')
      .send({ text })
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err) => {
        if (err) done(err);
        else {
          Todo.find({ text })
            .then((todos) => {
              // console.log(todos);
              expect(todos.length).toBe(1);
              expect(todos[0].text).toBe(text);
              done();
            })
            .catch(done);
        }
      });
  });

  it('should not create a new todo', (done) => {
    request(app)
      .post('/todos')
      .send({ })
      .expect(400)
      .end((err) => {
        if (err) done(err);
        else {
          Todo.find()
            .then((todos) => {
              expect(todos.length).toBe(testTodos.length);
              done();
            })
            .catch(done);
        }
      });
  });
});

describe('Test Suite: GET /todos', () => {
  it('should return all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect(res => expect(res.body.todos.length).toBe(testTodos.length))
      .end(done);
  });
});

describe('Test Suite: GET /todos/:id', () => {
  it('should return a single todo', (done) => {
    const { _id, text } = testTodos[0];
    request(app)
      .get(`/todos/${_id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(`${_id}`);
        expect(res.body.todo.text).toBe(text);
      })
      .end(done);
  });

  it('should return 404 if todo id is not found', (done) => {
    request(app)
      .get(`/todos/${ObjectID()}`)
      .expect(404)
      .end(done);
  });

  it('should return 404 if todo id is invalid', (done) => {
    request(app)
      .get('/todos/123}')
      .expect(404)
      .end(done);
  });
});

after(() => {
  server.close(() => debug('Express Server Closed'));
  db.close();
});
