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
  _creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});

exports.Todo = mongoose.model('Todo', todoSchema);
