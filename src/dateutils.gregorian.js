/**
 * Copyright 2016 Reza (github.com/rghorbani).
 *
 * @flow
 */

'use strict';

const Moment = require('moment');

function sameMonth(a, b) {
  return (
    a instanceof Moment &&
    b instanceof Moment &&
    a.year() === b.year() &&
    a.month() === b.month()
  );
}

function sameDate(a, b) {
  return (
    a instanceof Moment &&
    b instanceof Moment &&
    a.year() === b.year() &&
    a.month() === b.month() &&
    a.date() === b.date()
  );
}

function isGTE(a, b) {
  return b.diff(a, 'days') < 1;
}

function isLTE(a, b) {
  return a.diff(b, 'days') < 1;
}

function fromTo(a, b) {
  const days = [];
  let from = +a,
    to = +b;
  for (; from <= to; from = new Moment(from).add(1, 'days').valueOf()) {
    days.push(new Moment(from));
  }
  return days;
}

function month(xd) {
  const year = xd.year(),
    month = xd.month();
  const days = xd.daysInMonth();

  const firstDay = Moment.utc([year, month, 1, 0, 0, 0]);
  const lastDay = Moment.utc([year, month, days, 0, 0, 0]);

  return fromTo(firstDay, lastDay);
}

function weekDayNames(firstDayOfWeek = 0) {
  let weekDaysNames = Moment.weekdaysShort();
  const dayShift = firstDayOfWeek % 7;
  if (dayShift) {
    weekDaysNames = weekDaysNames
      .slice(dayShift)
      .concat(weekDaysNames.slice(0, dayShift));
  }
  return weekDaysNames;
}

function page(xd, firstDayOfWeek) {
  const days = month(xd);
  // for (let i = 0; i < days.length; i++) {
  //   console.log(days[i].format())
  // }
  let before = [],
    after = [];

  const fdow = (7 + firstDayOfWeek) % 7 || 7;
  const ldow = (fdow + 6) % 7;

  firstDayOfWeek = firstDayOfWeek || 0;

  const from = days[0].clone();
  if (from.day() !== fdow) {
    from.add(-(from.day() + 7 - fdow) % 7, 'days');
  }

  const to = days[days.length - 1].clone();
  const day = to.day();
  if (day !== ldow) {
    to.add((ldow + 7 - day) % 7, 'days');
  }

  if (isLTE(from, days[0])) {
    before = fromTo(from, days[0]);
  }

  if (isGTE(to, days[days.length - 1])) {
    after = fromTo(days[days.length - 1], to);
  }

  return before.concat(days.slice(1, days.length - 1), after);
}

module.exports = {
  weekDayNames,
  sameMonth,
  sameDate,
  month,
  page,
  fromTo,
  isLTE,
  isGTE,
};
