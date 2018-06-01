'use strict';

require('colors');

const env = process.env.NODE_ENV || 'development';
const jwtSecret = 'abc123';
const genSaltRounds = 10;

console.log(`  Env: ${env}`.yellow);

const checkEnv = () => {
  const localDevUri = 'mongodb://localhost:27017/TodoApp';
  const localTestUri = 'mongodb://localhost:27017/TestTodoApp';
  switch (env) {
    case 'development':
      process.env.MONGOURI = localDevUri;
      break;
    case 'test':
      process.env.MONGOURI = process.env.MONGOLAB_TEST_URI || localTestUri;
      break;
    case 'production':
      process.env.MONGOURI = process.env.MONGOLAB_URI;
      break;
    default:
      console.log('Unrecognised NODE_ENV value, exiting...'.red);
      process.exit();
  }
};

module.exports = { checkEnv, jwtSecret, genSaltRounds };
