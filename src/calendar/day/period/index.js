/**
 * Copyright 2016 Reza (github.com/rghorbani).
 *
 * @flow
 */

'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const isEqual = require('lodash.isequal');
const { StyleSheet, TouchableWithoutFeedback } = require('react-native');
const { Text, View } = require('react-native-common');

const { shouldUpdate } = require('../../../component-updater');
const defaultStyle = require('../../../style');

class Day extends React.Component {
  static propTypes = {
    // TODO: selected + disabled props should be removed
    state: PropTypes.oneOf(['selected', 'disabled', 'today', '']),

    // Specify theme properties to override specific styles for calendar parts. Default = {}
    theme: PropTypes.object,
    marking: PropTypes.any,

    onPress: PropTypes.func,
    onLongPress: PropTypes.func,
    date: PropTypes.object,

    markingExists: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.theme = { ...defaultStyle, ...(props.theme || {}) };
    this.style = styleConstructor(props.theme, props);
    this.markingStyle = this.getDrawingStyle(props.marking || []);
    this.onDayPress = this.onDayPress.bind(this);
    this.onDayLongPress = this.onDayLongPress.bind(this);
  }

  onDayPress() {
    this.props.onPress(this.props.date);
  }

  onDayLongPress() {
    this.props.onLongPress(this.props.date);
  }

  shouldComponentUpdate(nextProps) {
    const newMarkingStyle = this.getDrawingStyle(nextProps.marking);

    if (!isEqual(this.markingStyle, newMarkingStyle)) {
      this.markingStyle = newMarkingStyle;
      return true;
    }

    return shouldUpdate(this.props, nextProps, [
      'state',
      'children',
      'onPress',
      'onLongPress',
    ]);
  }

  getDrawingStyle(marking) {
    const defaultStyle = { textStyle: {} };
    if (!marking) {
      return defaultStyle;
    }
    if (marking.disabled) {
      defaultStyle.textStyle.color = this.theme.textDisabledColor;
    } else if (marking.selected) {
      defaultStyle.textStyle.color = this.theme.selectedDayTextColor;
    }
    const resultStyle = [marking].reduce((prev, next) => {
      if (next.quickAction) {
        if (next.first || next.last) {
          prev.containerStyle = this.style.firstQuickAction;
          prev.textStyle = this.style.firstQuickActionText;
          if (next.endSelected && next.first && !next.last) {
            prev.rightFillerStyle = '#c1e4fe';
          } else if (next.endSelected && next.last && !next.first) {
            prev.leftFillerStyle = '#c1e4fe';
          }
        } else if (!next.endSelected) {
          prev.containerStyle = this.style.quickAction;
          prev.textStyle = this.style.quickActionText;
        } else if (next.endSelected) {
          prev.leftFillerStyle = '#c1e4fe';
          prev.rightFillerStyle = '#c1e4fe';
        }
        return prev;
      }

      const color = next.color;
      if (next.status === 'NotAvailable') {
        prev.textStyle = this.style.naText;
      }
      if (next.startingDay) {
        prev.startingDay = {
          color,
        };
      }
      if (next.endingDay) {
        prev.endingDay = {
          color,
        };
      }
      if (!next.startingDay && !next.endingDay) {
        prev.day = {
          color,
        };
      }
      if (next.textColor) {
        prev.textStyle.color = next.textColor;
      }
      return prev;
    }, defaultStyle);
    return resultStyle;
  }

  render() {
    const containerStyle = [this.style.base];
    const textStyle = [this.style.text];
    let leftFillerStyle = {};
    let rightFillerStyle = {};
    let fillerStyle = {};
    let fillers;

    if (this.props.state === 'disabled') {
      textStyle.push(this.style.disabledText);
    } else if (this.props.state === 'today') {
      containerStyle.push(this.style.today);
      textStyle.push(this.style.todayText);
    }

    if (this.props.marking) {
      containerStyle.push({
        borderRadius: 17,
      });

      const flags = this.markingStyle;
      if (flags.textStyle) {
        textStyle.push(flags.textStyle);
      }
      if (flags.containerStyle) {
        containerStyle.push(flags.containerStyle);
      }
      if (flags.leftFillerStyle) {
        leftFillerStyle.backgroundColor = flags.leftFillerStyle;
      }
      if (flags.rightFillerStyle) {
        rightFillerStyle.backgroundColor = flags.rightFillerStyle;
      }

      if (flags.startingDay && !flags.endingDay) {
        leftFillerStyle = {
          backgroundColor: this.theme.calendarBackground,
        };
        rightFillerStyle = {
          backgroundColor: flags.startingDay.color,
        };
        containerStyle.push({
          backgroundColor: flags.startingDay.color,
        });
      } else if (flags.endingDay && !flags.startingDay) {
        rightFillerStyle = {
          backgroundColor: this.theme.calendarBackground,
        };
        leftFillerStyle = {
          backgroundColor: flags.endingDay.color,
        };
        containerStyle.push({
          backgroundColor: flags.endingDay.color,
        });
      } else if (flags.day) {
        leftFillerStyle = { backgroundColor: flags.day.color };
        rightFillerStyle = { backgroundColor: flags.day.color };
        // #177 bug
        fillerStyle = { backgroundColor: flags.day.color };
      } else if (flags.endingDay && flags.startingDay) {
        rightFillerStyle = {
          backgroundColor: this.theme.calendarBackground,
        };
        leftFillerStyle = {
          backgroundColor: this.theme.calendarBackground,
        };
        containerStyle.push({
          backgroundColor: flags.endingDay.color,
        });
      }

      fillers = (
        <View style={[this.style.fillers, fillerStyle]}>
          <View style={[this.style.leftFiller, leftFillerStyle]} />
          <View style={[this.style.rightFiller, rightFillerStyle]} />
        </View>
      );
    }

    return (
      <TouchableWithoutFeedback
        onPress={this.onDayPress}
        onLongPress={this.onDayLongPress}
      >
        <View style={this.style.wrapper}>
          {fillers}
          <View style={containerStyle}>
            <Text allowFontScaling={false} style={textStyle}>
              {String(this.props.children)}
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const STYLESHEET_ID = 'stylesheet.day.period';

const FILLER_HEIGHT = 34;

function styleConstructor(theme = {}, { rtl, type }) {
  if (rtl === undefined) {
    if (type === 'jalaali') {
      rtl = true;
    } else {
      rtl = false;
    }
  }
  const appStyle = { ...defaultStyle, ...theme };
  return StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      alignSelf: 'stretch',
      marginLeft: -1,
    },
    base: {
      //borderWidth: 1,
      width: 38,
      height: FILLER_HEIGHT,
      alignItems: 'center',
    },
    fillers: {
      position: 'absolute',
      height: FILLER_HEIGHT,
      flexDirection: rtl ? 'row-reverse' : 'row',
      left: 0,
      right: 0,
    },
    leftFiller: {
      height: FILLER_HEIGHT,
      flex: 1,
    },
    rightFiller: {
      height: FILLER_HEIGHT,
      flex: 1,
    },
    text: {
      marginTop: 7,
      fontSize: appStyle.textDayFontSize,
      fontFamily: appStyle.textDayFontFamily,
      fontWeight: '300',
      color: appStyle.dayTextColor || '#2d4150',
      backgroundColor: 'rgba(255, 255, 255, 0)',
    },
    today: {
      backgroundColor: appStyle.todayBackgroundColor,
    },
    todayText: {
      fontWeight: '500',
      color: theme.todayTextColor || appStyle.dayTextColor,
      //color: appStyle.textLinkColor
    },
    disabledText: {
      color: appStyle.textDisabledColor,
    },
    quickAction: {
      backgroundColor: 'white',
      borderWidth: 1,
      borderColor: '#c1e4fe',
    },
    quickActionText: {
      marginTop: 6,
      color: appStyle.textColor,
    },
    firstQuickAction: {
      backgroundColor: appStyle.textLinkColor,
    },
    firstQuickActionText: {
      color: 'white',
    },
    naText: {
      color: '#b6c1cd',
    },
    ...(theme[STYLESHEET_ID] || {}),
  });
}

module.exports = Day;
