'use strict';

// console.log(Object.keys(global));
// console.log(global);

// console.log(global.process.versions);
const mongoose = require('mongoose');

// mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/TodoApp');

const todoSchema = mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Number,
    default: null,
  },
});

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
  },
});

const Todo = mongoose.model('Todo', todoSchema);
const User = mongoose.model('User', userSchema);

// save new something
const todo = new Todo({ text: 'a', completed: true, completedAt: Math.floor(Date.now() / 1000) });
const user = new User({ email: 'abc@example.org' });

// user.save().then(console.log, console.log);

// Promise.all([todo.save(), user.save().catch(x => new Promise((_, reject) => setTimeout(() => reject(x), 5000)))])
Promise.all([todo.save(), user.save()])
  .then(console.log, console.log)
  .then(() => mongoose.connection.close());
