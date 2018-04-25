'use strict';

const express = require('express');

require('./db/mongoose');
const { Todo } = require('./models/todo');
// const { User } = require('./models/user');

const app = express();
app.use(express.json());

app.post('/todos', (req, res) => {
  const todo = new Todo({ text: req.body.text });
  todo.save().then(doc => res.send(doc), err => res.status(400).send(err));
  // res.end();
});

app.listen(3000, () => console.log('Express up on 3000'));

// const todo = new Todo({ text: 'a', completed: true, completedAt: Math.floor(Date.now() / 1000) });
// const user = new User({ email: 'abc@example.org' });
//
// Promise.all([todo.save(), user.save()])
//   .then(console.log, console.log)
//   .then(() => mongoose.connection.close());
