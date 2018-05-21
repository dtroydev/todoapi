/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

'use strict';

const request = require('supertest');
const expect = require('expect');
const debug = require('debug')('express');
const { app, server, errors } = require('../server');
const { Todo } = require('../models/todo');
const { ObjectID, db, errorsMongoose } = require('../db/mongoose');

// test data
const testTodos = [
  { _id: new ObjectID(), text: 'mocha testing todo #1' },
  { _id: new ObjectID(), text: 'mocha testing todo #2' },
];

// wait until connection is ready before testing
before((done) => {
  db.on('connected', done);
});

// populate with test data
beforeEach((done) => {
  Todo.deleteMany()
    .then(() => Todo.insertMany(testTodos))
    .then(() => done())
    .catch(done);
});

describe('Test Suite: Error Handlers', () => {
  it('Express Middleware should return 500 status code', () => {
    const req = {};
    const res = {
      data: null,
      code: null,
      status(status) {
        this.code = status;
        return this;
      },
      send(payload) {
        this.data = payload;
      },
    };
    const next = () => {};
    errors.expressHandler(new Error('Express Error Test'), req, res, next);
    expect(res.code).toBe(500);
  });
  it('Route Mongo error Handler should return 400 status code', () => {
    const res = {
      data: null,
      code: null,
      status(status) {
        this.code = status;
        return this;
      },
      send(payload) {
        this.data = payload;
      },
    };
    errors.mongoHandler.bind(res, 'Test')(new Error('Mongo Error Test'));
    expect(res.code).toBe(400);
    expect(res.data).toBeDefined();
  });

  it('Mongoose error Handler should return prefix and err message', () => {
    const prefix = 'Mongoose Error Handler Test';
    const errorMessage = 'Test Error Message';
    expect((errorsMongoose(prefix))(new Error(errorMessage))).toBe(`${prefix} ${errorMessage}`);
  });
});

describe('Test Suite: POST /todos', () => {
  it('should create a new todo', (done) => {
    const text = 'lorem ipsum blah blah';
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
      .get('/todos/123')
      .expect(404)
      .end(done);
  });
});

describe('Test Suite: DELETE /todos/:id', () => {
  it('should delete a single todo', (done) => {
    const { _id, text } = testTodos[0];
    request(app)
      .delete(`/todos/${_id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(`${_id}`);
        expect(res.body.todo.text).toBe(text);
      })
      .end((err) => {
        if (err) done(err);
        else {
          Todo.findById(_id).then((todo) => {
            expect(todo).toBeNull();
            done();
          })
            .catch(done);
        }
      });
  });

  it('should return 404 if todo id is not found', (done) => {
    request(app)
      .delete(`/todos/${ObjectID()}`)
      .expect(404)
      .end(done);
  });

  it('should return 404 if todo id is invalid', (done) => {
    request(app)
      .delete('/todos/123')
      .expect(404)
      .end(done);
  });
});

describe('Test Suite: PATCH /todos/:id', () => {
  const text = 'patched text';
  const { _id } = testTodos[0];

  it('should update a single todo', (done) => {
    request(app)
      .patch(`/todos/${_id}`)
      .send({ text })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(`${_id}`);
        // expect(res.body.todo.text).toBe(text);
      })
      .end((err) => {
        if (err) done(err);
        else {
          Todo.findById(_id).then((todo) => {
            expect(todo.text).toBe(text);
            done();
          })
            .catch(done);
        }
      });
  });

  it('should set completedAt timestamp if complete is true', (done) => {
    request(app)
      .patch(`/todos/${_id}`)
      .send({ text, completed: true })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(`${_id}`);
      })
      .end((err) => {
        if (err) done(err);
        else {
          Todo.findById(_id).then((todo) => {
            expect(todo.text).toBe(text);
            expect(todo.completed).toBe(true);
            const reTimeStamp = /^\d{13}$/;
            expect(reTimeStamp.test(todo.completedAt)).toBe(true);
            done();
          })
            .catch(done);
        }
      });
  });

  it('should set completedAt timestamp to be null if complete is false', (done) => {
    request(app)
      .patch(`/todos/${_id}`)
      .send({ text, completed: false })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(`${_id}`);
      })
      .end((err) => {
        if (err) done(err);
        else {
          Todo.findById(_id).then((todo) => {
            expect(todo.text).toBe(text);
            expect(todo.completed).toBe(false);
            expect(todo.completedAt).toBeNull();
            done();
          })
            .catch(done);
        }
      });
  });

  it('should return 404 if todo id is invalid', (done) => {
    request(app)
      .patch('/todos/123')
      .send({ text })
      .expect(404)
      .end(done);
  });

  it('should return 404 if todo id is not found', (done) => {
    request(app)
      .patch(`/todos/${ObjectID()}`)
      .send({ text })
      .expect(404)
      .end(done);
  });

  it('should return 400 if field data type mismatch is supplied', (done) => {
    request(app)
      .patch(`/todos/${_id}`)
      .send({ text: 123 })
      .expect(400)
      .end(done);
  });

  it('should return 400 if non-patch approved field is supplied', (done) => {
    request(app)
      .patch(`/todos/${_id}`)
      .send({ text: 123, completedAt: Date.now() })
      .expect(400)
      .end(done);
  });

  it('should return 400 if empty todo is supplied', (done) => {
    request(app)
      .patch(`/todos/${_id}`)
      .send({ })
      .expect(400)
      .end(done);
  });

  it('should return 400 if unknown todo fields are supplied', (done) => {
    request(app)
      .patch(`/todos/${_id}`)
      .send({ text, random: 'random' })
      .expect(400)
      .end(done);
  });
});

// close express server and mongo connection
after(() => {
  server.close(() => debug('Express Server Closed'));
  db.close();
});
