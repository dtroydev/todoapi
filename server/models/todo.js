'use strict';

const mongoose = require('mongoose');

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

exports.Todo = mongoose.model('Todo', todoSchema);
