/**
 * Copyright 2016 Reza (github.com/rghorbani).
 *
 * @flow
 */

'use strict';

const Moment = require('moment');

function padNumber(n) {
  if (n < 10) {
    return '0' + n;
  }
  return n;
}

function xdateToData(moment) {
  const dateString = moment.format('YYYY-MM-DD');
  return {
    year: moment.year(),
    month: moment.month() + 1,
    day: moment.date(),
    timestamp: Moment.utc(dateString).valueOf(),
    dateString: dateString,
  };
}

function parseDate(d) {
  if (!d) {
    return;
  } else if (d.timestamp) {
    // conventional data timestamp
    return Moment.utc(d.timestamp);
  } else if (d instanceof Moment) {
    // moment
    return Moment.utc(d.format('YYYY-MM-DD'));
  } else if (d.getTime) {
    // javascript date
    const dateString =
      d.getFullYear() +
      '-' +
      padNumber(d.getMonth() + 1) +
      '-' +
      padNumber(d.getDate());
    return Moment.utc(dateString);
  } else if (d.year) {
    const dateString =
      d.year + '-' + padNumber(d.month) + '-' + padNumber(d.day);
    return Moment.utc(dateString);
  } else if (d) {
    // timestamp number or date formatted as string
    return Moment.utc(d);
  }
}

module.exports = {
  xdateToData,
  parseDate,
};
