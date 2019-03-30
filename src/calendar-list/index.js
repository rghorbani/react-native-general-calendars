/**
 * Copyright 2016 Reza (github.com/rghorbani).
 *
 * @flow
 */

'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import Moment from 'moment';
import jMoment from 'moment-jalaali';
import { Dimensions, FlatList, Platform, StyleSheet } from 'react-native';

import CalendarListItem from './item';
import Calendar from '../calendar';
import defaultStyle from '../style';
import dateutils from '../dateutils';
import { xdateToData, parseDate } from '../interface';

const { width } = Dimensions.get('window');

class CalendarList extends React.Component {
  static propTypes = {
    ...Calendar.propTypes,

    // Whether the scroll is horizontal
    horizontal: PropTypes.bool,

    // Used when calendar scroll is horizontal, default is device width, pagination should be disabled
    calendarWidth: PropTypes.number,

    // hight of each calendar. Default = 360
    calendarHeight: PropTypes.number,

    // Max amount of months allowed to scroll to the past. Default = 50
    pastScrollRange: PropTypes.number,

    // Max amount of months allowed to scroll to the future. Default = 50
    futureScrollRange: PropTypes.number,

    // Enable or disable scrolling of calendar list
    scrollEnabled: PropTypes.bool,

    // Enable or disable vertical scroll indicator. Default = false
    showScrollIndicator: PropTypes.bool,

    // When true, the calendar list scrolls to top when the status bar is tapped. Default = false
    scrollsToTop: PropTypes.bool,
  };

  static defaultProps = {
    type: 'gregorian',
    calendarWidth: width,
    calendarHeight: 360,
    pastScrollRange: 50,
    futureScrollRange: 50,
    showScrollIndicator: false,
    scrollEnabled: true,
    scrollsToTop: false,
    removeClippedSubviews: Platform.OS === 'android' ? false : true,
  };

  constructor(props) {
    super(props);
    this.style = styleConstructor(props.theme);
    const rows = [];
    const texts = [];
    let date;
    if (props.type === 'jalaali') {
      date = parseDate(this.props.type, props.current) || jMoment.utc();
    } else {
      date = parseDate(this.props.type, props.current) || Moment.utc();
    }
    for (
      let i = 0;
      i <= this.props.pastScrollRange + this.props.futureScrollRange;
      i++
    ) {
      let rangeDate;
      let rangeDateStr;
      if (props.type === 'jalaali') {
        rangeDate = date.clone().add(i - this.props.pastScrollRange, 'jMonths');
        rangeDateStr = rangeDate.format('jMMMM jYYYY');
      } else {
        rangeDate = date.clone().add(i - this.props.pastScrollRange, 'months');
        rangeDateStr = rangeDate.format('MMM YYYY');
      }
      texts.push(rangeDateStr);
      /*
       * This selects range around current shown month [-0, +2] or [-1, +1] month for detail calendar rendering.
       * If `this.props.pastScrollRange` is `undefined` it's equal to `false` or 0 in next condition.
       */
      if (
        (this.props.pastScrollRange - 1 <= i &&
          i <= this.props.pastScrollRange + 1) ||
        (!this.props.pastScrollRange && i <= this.props.pastScrollRange + 2)
      ) {
        rows.push(rangeDate);
      } else {
        rows.push(rangeDateStr);
      }
    }

    this.state = {
      rows,
      texts,
      openDate: date,
    };

    this.onViewableItemsChangedBound = this.onViewableItemsChanged.bind(this);
    this.renderCalendar = this.renderCalendar.bind(this);
    this.getItemLayout = this.getItemLayout.bind(this);
    this.onLayout = this.onLayout.bind(this);
  }

  onLayout(event) {
    if (this.props.onLayout) {
      this.props.onLayout(event);
    }
  }

  scrollToDay(d, offset, animated) {
    const day = parseDate(this.props.type, d);
    let diffMonths;
    if (this.props.type === 'jalaali') {
      diffMonths = Math.round(
        this.state.openDate
          .clone()
          .jDate(1)
          .diff(day.clone().jDate(1), 'jMonths'),
      );
    } else {
      diffMonths = Math.round(
        this.state.openDate
          .clone()
          .date(1)
          .diff(day.clone().date(1), 'months'),
      );
    }
    const size = this.props.horizontal
      ? this.props.calendarWidth
      : this.props.calendarHeight;
    let scrollAmount =
      size * this.props.pastScrollRange + diffMonths * size + (offset || 0);
    if (!this.props.horizontal) {
      let week = 0;
      const days = dateutils.page(this.props.type, day, this.props.firstDay);
      for (let i = 0; i < days.length; i++) {
        week = Math.floor(i / 7);
        if (dateutils.sameDate(this.props.type, days[i], day)) {
          scrollAmount += 46 * week;
          break;
        }
      }
    }
    this.listView.scrollToOffset({ offset: scrollAmount, animated });
  }

  scrollToMonth(m) {
    const month = parseDate(this.props.type, m);
    const scrollTo = month || this.state.openDate;
    let diffMonths;
    if (this.props.type === 'jalaali') {
      diffMonths = Math.round(
        this.state.openDate
          .clone()
          .jDate(1)
          .diff(scrollTo.clone().jDate(1), 'jMonths'),
      );
    } else {
      diffMonths = Math.round(
        this.state.openDate
          .clone()
          .date(1)
          .diff(scrollTo.clone().date(1), 'months'),
      );
    }
    const size = this.props.horizontal
      ? this.props.calendarWidth
      : this.props.calendarHeight;
    const scrollAmount = size * this.props.pastScrollRange + diffMonths * size;
    //console.log(month, this.state.openDate);
    //console.log(scrollAmount, diffMonths);
    this.listView.scrollToOffset({ offset: scrollAmount, animated: false });
  }

  UNSAFE_componentWillReceiveProps(props) {
    const current = parseDate(this.props.type, this.props.current);
    const nextCurrent = parseDate(this.props.type, props.current);
    if (nextCurrent && current && nextCurrent.valueOf() !== current.valueOf()) {
      this.scrollToMonth(nextCurrent);
    }

    const rowclone = this.state.rows;
    const newrows = [];
    for (let i = 0; i < rowclone.length; i++) {
      let val = this.state.texts[i];
      if (rowclone[i].getTime) {
        val = rowclone[i].clone();
        val.propbump = rowclone[i].propbump ? rowclone[i].propbump + 1 : 1;
      }
      newrows.push(val);
    }
    this.setState({
      rows: newrows,
    });
  }

  onViewableItemsChanged({ viewableItems }) {
    function rowIsCloseToViewable(index, distance) {
      for (let i = 0; i < viewableItems.length; i++) {
        if (Math.abs(index - parseInt(viewableItems[i].index)) <= distance) {
          return true;
        }
      }
      return false;
    }

    const rowclone = this.state.rows;
    const newrows = [];
    const visibleMonths = [];
    for (let i = 0; i < rowclone.length; i++) {
      let val = rowclone[i];
      const rowShouldBeRendered = rowIsCloseToViewable(i, 1);
      if (rowShouldBeRendered && !rowclone[i].getTime) {
        if (this.props.type === 'jalaali') {
          val = this.state.openDate
            .clone()
            .add(i - this.props.pastScrollRange, 'jMonths');
        } else {
          val = this.state.openDate
            .clone()
            .add(i - this.props.pastScrollRange, 'months');
        }
      } else if (!rowShouldBeRendered) {
        val = this.state.texts[i];
      }
      newrows.push(val);
      if (rowIsCloseToViewable(i, 0)) {
        visibleMonths.push(xdateToData(this.props.type, val));
      }
    }
    if (this.props.onVisibleMonthsChange) {
      this.props.onVisibleMonthsChange(visibleMonths);
    }
    this.setState({
      rows: newrows,
    });
  }

  renderCalendar({ item }) {
    return (
      <CalendarListItem
        item={item}
        calendarHeight={this.props.calendarHeight}
        calendarWidth={
          this.props.horizontal ? this.props.calendarWidth : undefined
        }
        {...this.props}
      />
    );
  }

  getItemLayout(data, index) {
    return {
      length: this.props.horizontal
        ? this.props.calendarWidth
        : this.props.calendarHeight,
      offset:
        (this.props.horizontal
          ? this.props.calendarWidth
          : this.props.calendarHeight) * index,
      index,
    };
  }

  getMonthIndex(month) {
    let diffMonths;
    if (this.props.type === 'jalaali') {
      diffMonths =
        this.state.openDate.diff(month, 'jMonths') + this.props.pastScrollRange;
    } else {
      diffMonths =
        this.state.openDate.diff(month, 'months') + this.props.pastScrollRange;
    }
    return diffMonths;
  }

  render() {
    return (
      <FlatList
        ref={c => (this.listView = c)}
        onLayout={this.onLayout}
        style={[this.style.container, this.props.style]}
        initialListSize={
          this.props.pastScrollRange + this.props.futureScrollRange + 1
        }
        data={this.state.rows}
        removeClippedSubviews={this.props.removeClippedSubviews}
        pageSize={1}
        horizontal={this.props.horizontal || false}
        pagingEnabled={this.props.pagingEnabled}
        onViewableItemsChanged={this.onViewableItemsChangedBound}
        renderItem={this.renderCalendar}
        showsVerticalScrollIndicator={this.props.showScrollIndicator}
        showsHorizontalScrollIndicator={this.props.showScrollIndicator}
        scrollEnabled={this.props.scrollEnabled}
        keyExtractor={(item, index) => String(index)}
        initialScrollIndex={
          this.state.openDate ? this.getMonthIndex(this.state.openDate) : false
        }
        getItemLayout={this.getItemLayout}
        scrollsToTop={this.props.scrollsToTop}
      />
    );
  }
}

const STYLESHEET_ID = 'stylesheet.calendar-list.main';

function styleConstructor(theme = {}) {
  const appStyle = { ...defaultStyle, ...theme };
  return StyleSheet.create({
    container: {
      backgroundColor: appStyle.calendarBackground,
    },
    ...(theme[STYLESHEET_ID] || {}),
  });
}

module.exports = CalendarList;
