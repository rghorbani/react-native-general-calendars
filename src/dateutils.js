/**
 * Copyright 2016 Reza (github.com/rghorbani).
 *
 * @flow
 */

'use strict';

const gregorian = require('./dateutils.gregorian');
const jalaali = require('./dateutils.jalaali');
const Moment = require('moment');

function sameMonth(type, a, b) {
  if (type === 'jalaali') {
    return jalaali.sameMonth(a, b);
  }
  return gregorian.sameMonth(a, b);
}

function sameDate(type, a, b) {
  return (
    a instanceof Moment &&
    b instanceof Moment &&
    a.year() === b.year() &&
    a.month() === b.month() &&
    a.date() === b.date()
  );
}

function isGTE(type, a, b) {
  if (type === 'jalaali') {
    return jalaali.isGTE(a, b);
  }
  return gregorian.isGTE(a, b);
}

function isLTE(type, a, b) {
  if (type === 'jalaali') {
    return jalaali.isLTE(a, b);
  }
  return gregorian.isLTE(a, b);
}

function fromTo(type, a, b) {
  if (type === 'jalaali') {
    return jalaali.fromTo(a, b);
  }
  return gregorian.fromTo(a, b);
}

function month(type, xd) {
  if (type === 'jalaali') {
    return jalaali.month(xd);
  }
  return gregorian.month(xd);
}

function weekDayNames(type, firstDayOfWeek = 0) {
  if (type === 'jalaali') {
    return jalaali.weekDayNames(firstDayOfWeek);
  }
  return gregorian.weekDayNames(firstDayOfWeek);
}

function page(type, xd, firstDayOfWeek) {
  if (type === 'jalaali') {
    return jalaali.page(xd, firstDayOfWeek);
  }
  return gregorian.page(xd, firstDayOfWeek);
}

module.exports = {
  gregorian,
  jalaali,
  weekDayNames,
  sameMonth,
  sameDate,
  month,
  page,
  fromTo,
  isLTE,
  isGTE,
};
