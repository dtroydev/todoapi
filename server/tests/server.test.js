'use strict';

const request = require('supertest');
const expect = require('expect');
const debug = require('debug')('express');
const { app, server } = require('../server');
const { Todo } = require('../models/todo');
const { db } = require('../db/mongoose');

// delete existing todos before testing
beforeEach((done) => {
  Todo.deleteMany().then(() => done(), done);
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
          Todo.find()
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
              expect(todos.length).toBe(0);
              done();
            })
            .catch(done);
        }
      });
  });
});

after(() => {
  server.close(() => debug('Express Server Closed'));
  db.close();
});
