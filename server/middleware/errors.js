/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */

'use strict';

require('colors');
const debug = require('debug')('express');

const errors = {
  expressHandler(err, _req, res, _next) {
    debug(`Error: ${err.message}, sending ${err.status || 500} status code`.red);
    res.status(err.status || 500).send();
  },
  mongoHandler(op, err) {
    const code = 400;
    debug(`Error: ${err.message}, mongodb operation ${op} failed, sending ${code} status code`.red);
    this.status(code).send(err.message);
  },
};

exports.errors = errors;
