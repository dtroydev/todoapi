'use strict';

require('colors');

const genSaltRounds = 10;

const acceptedEnvs = ['production', 'development', 'test'];

const env = process.env.NODE_ENV || 'development';

if (!acceptedEnvs.includes(env)) {
  console.log('Unrecognised NODE_ENV value, exiting...'.red);
  process.exit();
}

const conf = process.env.HEROKU ? null : require('./config.json');

if (!process.env.HEROKU) {
  console.log(`  Env: ${env} - local`.yellow);
  process.env.JWTSECRET = conf[env].JWTSECRET;
  process.env.MONGOURI = conf[env].MONGOURI;
  process.env.PORT = conf[env].PORT;
} else {
  console.log(`  Env: ${env} - heroku`.yellow);
  if (env === 'production') process.env.MONGOURI = process.env.MONGOLAB_URI;
  if (env === 'test') process.env.MONGOURI = process.env.MONGOLAB_TEST_URI;
  // process.env.JWTSECRET has been configured on Heroku
  // process.env.PORT will be dynamically set by Heroku
}

module.exports = { genSaltRounds };
