/* eslint no-underscore-dangle: [ "error", { "allow": [ "_id", "_creator" ] } ] */

'use strict';

require('colors');
const request = require('supertest');
const expect = require('expect');
const sinon = require('sinon');
const debug = require('debug')('express');
const { app, server } = require('../server');
const { errors } = require('../middleware/errors');
const { Todo } = require('../models/todo');
const { User } = require('../models/user');
const { db, errorsMongoose } = require('../db/mongoose');
const { ObjectID } = require('mongodb');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');
const {
  waitForMongoServer,
  testTodos,
  testUsers,
  testToken,
  populateTodos,
  populateUsers,
} = require('./seed/seed');

// wait until connection is ready before testing
before(waitForMongoServer);
// before(populateUsers); // once user patch and delete tests are added swap to beforeEach
// populate with test data
beforeEach(populateTodos);
beforeEach(populateUsers);

describe('Test Suite: Error Handlers'.black.bgWhite, () => {
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

describe('Test Suite: POST /todos'.black.bgWhite, () => {
  const { _id, tokens: [{ token }] } = testUsers[0];
  const text = 'lorem ipsum blah blah';
  it('should create a new todo', (done) => {
    request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ text })
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
        expect(res.header.authorization.slice(7)).toBe(token);
      })
      .end((err) => {
        if (err) done(err);
        else {
          Todo.find({ text })
            .then((todos) => {
              // console.log(todos);
              expect(todos.length).toBe(1);
              expect(todos[0].text).toBe(text);
              expect(todos[0]._creator).toEqual(_id);
              done();
            })
            .catch(done);
        }
      });
  });

  it('should not create a new todo missing content', (done) => {
    request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${token}`)
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

  it('should not create a new todo missing token', (done) => {
    request(app)
      .post('/todos')
      .send({ text })
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

describe('Test Suite: GET /todos'.black.bgWhite, () => {
  const { _id, tokens: [{ token }] } = testUsers[0];
  it('should return todos with valid token that belong to user', (done) => {
    request(app)
      .get('/todos')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        return Todo.find({ _creator: _id })
          .then((todos) => {
            expect(JSON.stringify(res.body.todos)).toEqual(JSON.stringify(todos));
            expect(res.header.authorization.slice(7)).toBe(token);
            done();
          })
          .catch(done);
      });
  });

  it('should not return todos if body data is present', (done) => {
    request(app)
      .get('/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ random: 'random' })
      .expect(400)
      .end(done);
  });

  it('should not return todos without token', (done) => {
    request(app)
      .get('/todos')
      .expect(400)
      .end(done);
  });
});

describe('Test Suite: GET /todos/:id'.black.bgWhite, () => {
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

describe('Test Suite: DELETE /todos/:id'.black.bgWhite, () => {
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

describe('Test Suite: PATCH /todos/:id'.black.bgWhite, () => {
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

describe('Test Suite: POST /users'.black.bgWhite, () => {
  it('should create a new user', (done) => {
    const user = { email: 'sample@example.com', password: 'samplePass' };
    request(app)
      .post('/users')
      .send(user)
      .expect(200)
      .then(async (res) => {
        const { _id, email } = res.body;
        expect(ObjectID.isValid(_id)).toBe(true);
        expect(email).toBe(user.email);
        expect(Object.keys(res.body).length).toBe(2);
        const token = res.header.authorization.slice(7); // remove 'Bearer '
        const rpayload = await promisify(jwt.verify)(token, jwtSecret);
        const payload = { _id, access: 'auth', iat: rpayload.iat };
        expect(rpayload).toEqual(payload);
        return { _id, token };
      })
      .then(({ _id: rid, token: rtoken }) =>
      // the User.find promise needs to be the return value of this then handler
        User.find({ email: user.email })
          .then(async (users) => {
            expect(users.length).toBe(1);
            const [{
              _id, email, password: hash, tokens: [{ access, token }],
            }] = users;
            expect(`${_id}`).toBe(rid);
            expect(email).toBe(user.email);
            expect(bcrypt.compareSync(user.password, hash)).toBe(true);
            expect(access).toBe('auth');
            expect(token).toBe(rtoken);
          }))
      .then(() => done())
      .catch(done);
  });

  it('should return 400 if missing required user fields', (done) => {
    const user = { email: 'sample@example.com' };
    request(app)
      .post('/users')
      .send(user)
      .expect(400)
      .end(done);
  });

  it('should return 400 if unknown user fields are supplied', (done) => {
    const user = { email: 'sample@example.com', password: 'samplePass', random: 'random' };
    request(app)
      .post('/users')
      .send(user)
      .expect(400)
      .end(done);
  });

  it('should return 400 if password is too short', (done) => {
    const user = { email: 'sample@example.com', password: '123' };
    request(app)
      .post('/users')
      .send(user)
      .expect(400)
      .end(done);
  });

  it('should return 400 if email is in use', (done) => {
    const { email } = testUsers[0];
    const user = { email, password: '123456' };
    request(app)
      .post('/users')
      .send(user)
      .expect(400)
      .end(done);
  });

  it('should return 400 if email is invalid', (done) => {
    const user = { email: 'abc', password: '123456' };
    request(app)
      .post('/users')
      .send(user)
      .expect(400)
      .end(done);
  });

  it('should not hash a hash if save is done more than once', async () => {
    const user = new User({ email: 'sample2@example.com', password: 'samplePass' });
    const { password: hash1 } = await user.save();
    const { password: hash2 } = await user.save();
    expect(hash1).toBe(hash2);
  });
});

describe('Test Suite: GET /users/me'.black.bgWhite, () => {
  it('should return user id and email if valid token is supplied', (done) => {
    const { _id, email, tokens: [{ token }] } = testUsers[0];
    request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(`${_id}`);
        expect(res.body.email).toBe(email);
        expect(Object.keys(res.body).length).toBe(2);
        expect(res.header.authorization.slice(7)).toBe(token);
      })
      .end(done);
  });

  it('should return 400 if there is unexpected data in body', (done) => {
    const { tokens: [{ token }] } = testUsers[0];
    request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ random: 'random' })
      .expect(400)
      .end(done);
  });

  it('should return 400 if token is not supplied', (done) => {
    request(app)
      .get('/users/me')
      .expect(400)
      .end(done);
  });

  it('should return 400 if token has invalid format {missing dots}', (done) => {
    request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${testToken.replace('.', '')}`)
      .expect(400)
      .end(done);
  });

  it('should return 400 if token has invalid format {missing "Bearer " prefix}', (done) => {
    request(app)
      .get('/users/me')
      .set('Authorization', `${testToken}`)
      .expect(400)
      .end(done);
  });

  it('should return 400 if token has invalid format {invalid chars}', (done) => {
    request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ^${testToken.slice(1)}`)
      .expect(400)
      .end(done);
  });

  it('should return 400 if token has invalid format {missing a character}', (done) => {
    request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${testToken.slice(1)}`)
      .expect(400)
      .end(done);
  });

  it('should return 400 if token has invalid signature', (done) => {
    request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${testToken.slice(0, -1)}`)
      .expect(400)
      .end(done);
  });

  it('should return 404 if token is valid but not found', (done) => {
    request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${testToken}`)
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('Test Suite: POST /users/login'.black.bgWhite, () => {
  const { email: loginEmail, password: loginPassword } = testUsers[0];

  it('should login a new user', (done) => {
    request(app)
      .post('/users/login')
      .send({ email: loginEmail, password: loginPassword })
      .expect(200)
      .then(async (res) => {
        const { _id: responseId, email: responseEmail } = res.body;
        expect(ObjectID.isValid(responseId)).toBe(true);
        expect(responseEmail).toBe(loginEmail);
        expect(Object.keys(res.body).length).toBe(2);
        const responseToken = res.header.authorization.slice(7); // remove 'Bearer '
        const responsePayload = await promisify(jwt.verify)(responseToken, jwtSecret);
        const expectedPayload = { _id: responseId, access: 'auth', iat: responsePayload.iat };
        expect(responsePayload).toEqual(expectedPayload);
        return { responseToken, responseId };
      })
      .then(({ responseToken, responseId }) =>
        User.findByToken(responseToken)
          .then((user) => {
            const { _id } = user;
            expect(`${_id}`).toBe(responseId);
          }))
      .then(() => done())
      .catch(done);
  });

  it('should not login a new user with wrong password', (done) => {
    const { _id, email: _loginEmail, password: _loginPassword } = testUsers[1];
    request(app)
      .post('/users/login')
      .send({ email: _loginEmail, password: `${_loginPassword}blah` })
      .expect(400)
      .expect(res => expect(res.headers.authorization).toBeUndefined())
      .then(() =>
        User.findById({ _id }).then((user) => {
          expect(user.tokens).toHaveLength(0);
        }))
      .then(() => done())
      .catch(done);
  });

  it('should not login an unknown user', (done) => {
    request(app)
      .post('/users/login')
      .send({ email: 'someuser@example.com', password: '123456' })
      .expect(400)
      .expect(res => expect(res.headers.authorization).toBeUndefined())
      .then(() => done())
      .catch(done);
  });

  it('should return 400 if missing required user fields', (done) => {
    request(app)
      .post('/users/login')
      .send({ email: loginEmail })
      .expect(400)
      .expect(res => expect(res.headers.authorization).toBeUndefined())
      .end(done);
  });

  it('should return 400 if unknown user fields are supplied', (done) => {
    request(app)
      .post('/users/login')
      .send({ email: loginEmail, password: loginPassword, random: 'random' })
      .expect(400)
      .expect(res => expect(res.headers.authorization).toBeUndefined())
      .end(done);
  });

  it('should return 400 if email is invalid', (done) => {
    const user = { email: 'abc', password: '123456' };
    request(app)
      .post('/users/login')
      .send(user)
      .expect(400)
      .expect(res => expect(res.headers.authorization).toBeUndefined())
      .end(done);
  });

  it('should return 400 if mongoose error occurs at findByCredentials', (done) => {
    const stub = sinon.stub(User, 'findByCredentials').rejects('MongoError', 'findByCredentials Stub Error');
    request(app)
      .post('/users/login')
      .send({ email: loginEmail, password: loginPassword })
      .expect(400)
      .expect(res => expect(res.headers.authorization).toBeUndefined())
      .end((err) => {
        if (err) return done(err);
        stub.restore();
        return done();
      });
  });

  it('should return 400 if mongoose error occurs at findOne', (done) => {
    const stub = sinon.stub(User, 'findOne').rejects('MongoError', 'findOne Stub Error');
    request(app)
      .post('/users/login')
      .send({ email: loginEmail, password: loginPassword })
      .expect(400)
      .expect(res => expect(res.headers.authorization).toBeUndefined())
      .end((err) => {
        if (err) return done(err);
        stub.restore();
        return done();
      });
  });
});

describe('Test Suite: DELETE /users/me/token'.black.bgWhite, () => {
  const { tokens: [{ token }] } = testUsers[0];

  it('should logout a user with valid token', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('Authorization', `Bearer ${token}`)
      .send()
      .expect(200)
      .then(() => User.findByToken(token)
        .then(user => expect(user).toBeNull()))
      .then(() => done())
      .catch(done);
  });

  it('should return 400 for user with valid token with unexpected body data', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('Authorization', `Bearer ${token}`)
      .send({ random: 'random' })
      .expect(400)
      .end(done);
  });

  it('should return 400 if token does not exist', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('Authorization', `Bearer ${testToken}`)
      .send()
      .expect(400)
      .end(done);
  });

  it('should return 400 if mongoose error occurs at removeJWT', (done) => {
    const stub = sinon.stub(User.prototype, 'removeJWT').rejects('MongoError', 'removeJWT Stub Error');
    request(app)
      .delete('/users/me/token')
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
      .expect(res => expect(res.headers.authorization).toBeUndefined())
      .end((err) => {
        if (err) return done(err);
        stub.restore();
        return done();
      });
  });

  it('should return 400 if mongoose error occurs at update', (done) => {
    const stub = sinon.stub(User, 'update').rejects('MongoError', 'update Stub Error');
    request(app)
      .delete('/users/me/token')
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
      .expect(res => expect(res.headers.authorization).toBeUndefined())
      .end((err) => {
        if (err) return done(err);
        stub.restore();
        return done();
      });
  });

  it('should return 400 if somehow removeJWT got an invalid token', async () => {
    const user = await User.findById(testUsers[0]);
    const removeJWTbound = User.prototype.removeJWT.bind(user, testToken);
    const stub = sinon.stub(User.prototype, 'removeJWT').callsFake(removeJWTbound);
    return request(app)
      .delete('/users/me/token')
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
      .expect(res => expect(res.headers.authorization).toBeUndefined())
      .then(() => {
        stub.restore();
      });
  });
});

// close express server and mongo connection
after(() => {
  server.close(() => debug('Express Server Closed'));
  db.close();
});
