/**
 * Copyright 2016 Reza (github.com/rghorbani).
 *
 * @flow
 */

'use strict';

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Calendar from '../calendar';
import defaultStyle from '../style';

class CalendarListItem extends React.Component {
  static defaultProps = {
    hideArrows: true,
    hideExtraDays: true,
  };

  constructor(props) {
    super(props);
    this.style = styleConstructor(props.theme);
  }

  shouldComponentUpdate(nextProps) {
    const r1 = this.props.item;
    const r2 = nextProps.item;
    return (
      (typeof r1 !== typeof r2 &&
        typeof r1 === 'string' &&
        r1.toString() !== r2.format('YYYY MM')) ||
      (typeof r1 !== typeof r2 &&
        typeof r2 === 'string' &&
        r2.toString() !== r1.format('YYYY MM')) ||
      !!(r2.propbump && r2.propbump !== r1.propbump)
    );
    // return r1.format('YYYY MM') !== r2.format('YYYY MM') || !!(r2.propbump && r2.propbump !== r1.propbump);
  }

  render() {
    const row = this.props.item;
    if (row.format) {
      return (
        <Calendar
          type={this.props.type}
          rtl={this.props.rtl}
          theme={this.props.theme}
          style={[{ height: this.props.calendarHeight }, this.style.calendar]}
          current={row}
          hideArrows={this.props.hideArrows}
          hideExtraDays={this.props.hideExtraDays}
          disableMonthChange
          markedDates={this.props.markedDates}
          markingType={this.props.markingType}
          hideDayNames={this.props.hideDayNames}
          onDayPress={this.props.onDayPress}
          onDayLongPress={this.props.onDayLongPress}
          displayLoadingIndicator={this.props.displayLoadingIndicator}
          minDate={this.props.minDate}
          maxDate={this.props.maxDate}
          firstDay={this.props.firstDay}
          monthFormat={this.props.monthFormat}
          dayComponent={this.props.dayComponent}
          disabledByDefault={this.props.disabledByDefault}
          showWeekNumbers={this.props.showWeekNumbers}
        />
      );
    } else {
      const text = row.toString();
      return (
        <View
          style={[
            { height: this.props.calendarHeight },
            this.style.placeholder,
          ]}
        >
          <Text allowFontScaling={false} style={this.style.placeholderText}>
            {text}
          </Text>
        </View>
      );
    }
  }
}

const STYLESHEET_ID = 'stylesheet.calendar-list.main';

function styleConstructor(theme = {}) {
  const appStyle = { ...defaultStyle, ...theme };
  return StyleSheet.create({
    placeholder: {
      backgroundColor: appStyle.calendarBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      fontSize: 30,
      fontWeight: '200',
      color: appStyle.dayTextColor,
    },
    calendar: {
      paddingLeft: 15,
      paddingRight: 15,
    },
    ...(theme[STYLESHEET_ID] || {}),
  });
}

module.exports = CalendarListItem;
