/**
 * Copyright 2016 Reza (github.com/rghorbani).
 *
 * @flow
 */

'use strict';

module.exports = {
  get Agenda() {
    return require('./agenda');
  },
  get Calendar() {
    return require('./calendar');
  },
  get CalendarList() {
    return require('./calendar-list');
  },
  get DatePicker() {
    return require('./datepicker');
  },
};
