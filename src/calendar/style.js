/**
 * Copyright 2016 Reza (github.com/rghorbani).
 *
 * @flow
 */

'use strict';

import { StyleSheet } from 'react-native';
import defaultStyle from '../style';

const STYLESHEET_ID = 'stylesheet.calendar.main';

function getStyle(theme = {}) {
  const appStyle = { ...defaultStyle, ...theme };
  return StyleSheet.create({
    container: {
      paddingLeft: 5,
      paddingRight: 5,
      backgroundColor: appStyle.calendarBackground,
    },
    week: {
      marginTop: 7,
      marginBottom: 7,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    ...(theme[STYLESHEET_ID] || {}),
  });
}

module.exports = getStyle;
