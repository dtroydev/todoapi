'use strict';

const request = require('supertest');
const expect = require('expect');
const debug = require('debug')('express');
const { app, server } = require('../server');
const { Todo } = require('../models/todo');
const { db } = require('../db/mongoose');

// test data
const testTodos = [
  { text: 'test todo #1' },
  { text: 'test todo #2' },
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
  it('get all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(testTodos.length);
      })
      .end((err) => {
        if (err) done(err);
        else done();
      });
  });
});

after(() => {
  server.close(() => debug('Express Server Closed'));
  db.close();
});
