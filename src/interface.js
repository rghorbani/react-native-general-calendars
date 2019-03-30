/**
 * Copyright 2016 Reza (github.com/rghorbani).
 *
 * @flow
 */

'use strict';

const gregorian = require('./interface.gregorian');
const jalaali = require('./interface.jalaali');

function xdateToData(type, moment) {
  if (type === 'jalaali') {
    return jalaali.xdateToData(moment);
  }
  return gregorian.xdateToData(moment);
}

function parseDate(type, d) {
  if (type === 'jalaali') {
    return jalaali.parseDate(d);
  }
  return gregorian.parseDate(d);
}

module.exports = {
  gregorian,
  jalaali,
  xdateToData,
  parseDate,
};
