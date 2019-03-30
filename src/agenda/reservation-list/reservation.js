/**
 * Copyright 2016 Reza (github.com/rghorbani).
 *
 * @flow
 */

'use strict';

import React from 'react';
import Moment from 'moment';
import jMoment from 'moment-jalaali';
import { StyleSheet, Text, View } from 'react-native';

import dateutils from '../../dateutils';
import defaultStyle from '../../style';
import { xdateToData } from '../../interface';

class ReservationListItem extends React.Component {
  constructor(props) {
    super(props);
    this.styles = styleConstructor(props.theme);
  }

  shouldComponentUpdate(nextProps) {
    const r1 = this.props.item;
    const r2 = nextProps.item;
    let changed = true;
    if (!r1 && !r2) {
      changed = false;
    } else if (r1 && r2) {
      if (r1.day.valueOf() !== r2.day.valueOf()) {
        changed = true;
      } else if (!r1.reservation && !r2.reservation) {
        changed = false;
      } else if (r1.reservation && r2.reservation) {
        if ((!r1.date && !r2.date) || (r1.date && r2.date)) {
          changed = this.props.rowHasChanged(r1.reservation, r2.reservation);
        }
      }
    }
    return changed;
  }

  renderDate(date, item) {
    if (this.props.renderDay) {
      return this.props.renderDay(
        date ? xdateToData(this.props.type, date) : undefined,
        item,
      );
    }
    let todayDate;
    if (this.props.type === 'jalaali') {
      todayDate = jMoment.utc();
    } else {
      todayDate = Moment.utc();
    }
    const today = dateutils.sameDate(this.props.type, date, todayDate)
      ? this.styles.today
      : undefined;
    if (date) {
      const jDate =
        this.props.type === 'jalaali' ? jMoment(date).jDate() : date.date();
      return (
        <View style={this.styles.day}>
          <Text allowFontScaling={false} style={[this.styles.dayNum, today]}>
            {jDate}
          </Text>
          <Text allowFontScaling={false} style={[this.styles.dayText, today]}>
            {dateutils.weekDayNames(this.props.type)[date.day()]}
          </Text>
        </View>
      );
    } else {
      return <View style={this.styles.day} />;
    }
  }

  render() {
    const { reservation, date } = this.props.item;
    let content;
    if (reservation) {
      const firstItem = date ? true : false;
      content = this.props.renderItem(reservation, firstItem);
    } else {
      content = this.props.renderEmptyDate(date);
    }
    return (
      <View style={this.styles.container}>
        {this.renderDate(date, reservation)}
        <View style={{ flex: 1 }}>{content}</View>
      </View>
    );
  }
}

const STYLESHEET_ID = 'stylesheet.agenda.list';

function styleConstructor(theme = {}) {
  const appStyle = { ...defaultStyle, ...theme };
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
    },
    dayNum: {
      fontSize: 28,
      fontWeight: '200',
      color: appStyle.agendaDayNumColor,
    },
    dayText: {
      fontSize: 14,
      fontWeight: '300',
      color: appStyle.agendaDayTextColor,
      marginTop: -5,
      backgroundColor: 'transparent',
    },
    day: {
      width: 63,
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginTop: 32,
    },
    today: {
      color: appStyle.agendaTodayColor,
    },
    ...(theme[STYLESHEET_ID] || {}),
  });
}

module.exports = ReservationListItem;
