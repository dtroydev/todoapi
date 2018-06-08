'use strict';

require('colors');

const genSaltRounds = 10;

const acceptedEnvs = ['production', 'development', 'test'];

const env = process.env.NODE_ENV || 'development';

if (!acceptedEnvs.includes(env)) {
  console.log('Error: Unrecognised NODE_ENV value -> '.red + `${env}`.yellow);
  process.exit();
}

// we rely on process.env.HEROKU to let us know if we are running there
const conf = process.env.HEROKU ? null : require('./config.json');

if (!process.env.HEROKU) {
  console.log(`  Env: ${env} - local`.yellow);
  Object.keys(conf[env]).forEach((k) => { process.env[k] = conf[env][k]; });
} else {
  console.log(`  Env: ${env} - heroku`.yellow);
  if (env === 'production') process.env.MONGOURI = process.env.MONGOLAB_URI;
  if (env === 'test') process.env.MONGOURI = process.env.MONGOLAB_TEST_URI;
  // process.env.JWTSECRET has been configured on Heroku
  // process.env.PORT will be dynamically set by Heroku
}

module.exports = { genSaltRounds };
