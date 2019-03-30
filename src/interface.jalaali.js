/**
 * Copyright 2016 Reza (github.com/rghorbani).
 *
 * @flow
 */

'use strict';

const Moment = require('moment');
const jMoment = require('moment-jalaali');

function padNumber(n) {
  if (n < 10) {
    return '0' + n;
  }
  return n;
}

function xdateToData(moment) {
  const dateString = moment.format('jYYYY-jMM-jDD');
  return {
    year: moment.jYear(),
    month: moment.jMonth() + 1,
    day: moment.jDate(),
    timestamp: jMoment.utc(dateString, 'jYYYY-jMM-jDD').valueOf(),
    dateString: dateString,
  };
}

function parseDate(d) {
  if (!d) {
    return;
  } else if (d.timestamp) {
    // conventional data timestamp
    return jMoment.utc(d.timestamp);
  } else if (d instanceof Moment) {
    // moment
    return jMoment.utc(d.format('YYYY-MM-DD'));
  } else if (d.getTime) {
    // javascript date
    const dateString =
      d.getFullYear() +
      '-' +
      padNumber(d.getMonth() + 1) +
      '-' +
      padNumber(d.getDate());
    return jMoment.utc(dateString);
  } else if (d.year) {
    const dateString =
      d.year + '-' + padNumber(d.month) + '-' + padNumber(d.day);
    return jMoment.utc(dateString);
  } else if (d) {
    // timestamp number or date formatted as string TODO
    return jMoment.utc(d);
  }
}

module.exports = {
  xdateToData,
  parseDate,
};
