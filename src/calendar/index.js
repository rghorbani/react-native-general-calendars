/**
 * Copyright 2016 Reza (github.com/rghorbani).
 *
 * @flow
 */

'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const Moment = require('moment');
const jMoment = require('moment-jalaali');
const { StyleSheet, View, ViewPropTypes } = require('react-native');

const Day = require('./day/basic');
const UnitDay = require('./day/period');
const MultiDotDay = require('./day/multi-dot');
const MultiPeriodDay = require('./day/multi-period');
const SingleDay = require('./day/custom');
const CalendarHeader = require('./header');
const shouldComponentUpdate = require('./updater');
const dateutils = require('../dateutils');
const defaultStyle = require('../style');
const { gregorian, jalaali, xdateToData, parseDate } = require('../interface');

//Fallback when RN version is < 0.44
const viewPropTypes = ViewPropTypes || View.propTypes;

const EmptyArray = [];

class Calendar extends React.Component {
  static propTypes = {
    // Calendar type
    type: PropTypes.oneOf(['gregorian', 'jalaali']),
    // is Calendar rtl
    rtl: PropTypes.bool,
    // Specify theme properties to override specific styles for calendar parts. Default = {}
    theme: PropTypes.object,
    // Collection of dates that have to be marked. Default = {}
    markedDates: PropTypes.object,

    // Specify style for calendar container element. Default = {}
    style: viewPropTypes.style,
    // Initially visible month. Default = Date()
    current: PropTypes.any,
    // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
    minDate: PropTypes.any,
    // Maximum date that can be selected, dates after maxDate will be grayed out. Default = undefined
    maxDate: PropTypes.any,

    // If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday.
    firstDay: PropTypes.number,

    // Date marking style [simple/period/multi-dot/multi-period]. Default = 'simple'
    markingType: PropTypes.string,

    // Hide month navigation arrows. Default = false
    hideArrows: PropTypes.bool,
    // Display loading indicador. Default = false
    displayLoadingIndicator: PropTypes.bool,
    // Do not show days of other months in month page. Default = false
    hideExtraDays: PropTypes.bool,

    // Handler which gets executed on day press. Default = undefined
    onDayPress: PropTypes.func,
    // Handler which gets executed on day long press. Default = undefined
    onDayLongPress: PropTypes.func,
    // Handler which gets executed when visible month changes in calendar. Default = undefined
    onMonthChange: PropTypes.func,
    onVisibleMonthsChange: PropTypes.func,
    // Replace default arrows with custom ones (direction can be 'left' or 'right')
    renderArrow: PropTypes.func,
    // Provide custom day rendering component
    dayComponent: PropTypes.any,
    // Month format in calendar title. Formatting values: https://momentjs.com/docs/#/displaying/format/
    monthFormat: PropTypes.string,
    // Disables changing month when click on days of other months (when hideExtraDays is false). Default = false
    disableMonthChange: PropTypes.bool,
    //  Hide day names. Default = false
    hideDayNames: PropTypes.bool,
    // Disable days by default. Default = false
    disabledByDefault: PropTypes.bool,
    // Show week numbers. Default = false
    showWeekNumbers: PropTypes.bool,
    // Handler which gets executed when press arrow icon left. It receive a callback can go back month
    onPressArrowLeft: PropTypes.func,
    // Handler which gets executed when press arrow icon left. It receive a callback can go next month
    onPressArrowRight: PropTypes.func,
  };

  static defaultProps = {
    type: 'gregorian',
  };

  constructor(props) {
    super(props);
    this.style = styleConstructor(props.theme, props);
    let currentMonth;
    if (props.current) {
      currentMonth = parseDate(props.type, props.current);
    } else {
      if (props.type === 'jalaali') {
        currentMonth = jMoment.utc();
      } else {
        currentMonth = Moment.utc();
      }
    }
    this.state = {
      currentMonth,
    };

    this.updateMonth = this.updateMonth.bind(this);
    this.addMonth = this.addMonth.bind(this);
    this.monthFormat = this.monthFormat.bind(this);
    this.pressDay = this.pressDay.bind(this);
    this.longPressDay = this.longPressDay.bind(this);
    this.shouldComponentUpdate = shouldComponentUpdate;
  }

  componentWillReceiveProps(nextProps) {
    const current = parseDate(this.props.type, nextProps.current);
    if (
      current &&
      current.format('YYYY MM') !== this.state.currentMonth.format('YYYY MM')
    ) {
      this.setState({
        currentMonth: current.clone(),
      });
    }
  }

  updateMonth(day, doNotTriggerListeners) {
    if (
      (this.props.type !== 'jalaali' &&
        day.format('YYYY MM') === this.state.currentMonth.format('YYYY MM')) ||
      (this.props.type === 'jalaali' &&
        day.format('jYYYY jMM') === this.state.currentMonth.format('jYYYY jMM'))
    ) {
      return;
    }
    this.setState(
      {
        currentMonth: day.clone(),
      },
      () => {
        if (!doNotTriggerListeners) {
          const currMont = this.state.currentMonth.clone();
          if (this.props.onMonthChange) {
            this.props.onMonthChange(xdateToData(this.props.type, currMont));
          }
          if (this.props.onVisibleMonthsChange) {
            this.props.onVisibleMonthsChange([
              xdateToData(this.props.type, currMont),
            ]);
          }
        }
      },
    );
  }

  _handleDayInteraction(date, interaction) {
    const day = parseDate(this.props.type, date);
    const minDate = parseDate(this.props.type, this.props.minDate);
    const maxDate = parseDate(this.props.type, this.props.maxDate);
    if (
      !(minDate && !dateutils.isGTE(this.props.type, day, minDate)) &&
      !(maxDate && !dateutils.isLTE(this.props.type, day, maxDate))
    ) {
      const shouldUpdateMonth =
        this.props.disableMonthChange === undefined ||
        !this.props.disableMonthChange;
      if (shouldUpdateMonth) {
        this.updateMonth(day);
      }
      if (interaction) {
        if (this.props.type === 'jalaali') {
          interaction(gregorian.xdateToData(day), jalaali.xdateToData(day));
        } else {
          interaction(gregorian.xdateToData(day), gregorian.xdateToData(day));
        }
      }
    }
  }

  pressDay(date) {
    this._handleDayInteraction(date, this.props.onDayPress);
  }

  longPressDay(date) {
    this._handleDayInteraction(date, this.props.onDayLongPress);
  }

  addMonth(count) {
    if (this.props.type === 'jalaali') {
      this.updateMonth(this.state.currentMonth.clone().add(count, 'jMonths'));
    } else {
      this.updateMonth(this.state.currentMonth.clone().add(count, 'months'));
    }
  }

  monthFormat() {
    if (this.props.monthFormat) {
      return this.props.monthFormat;
    }
    if (this.props.type === 'jalaali') {
      return 'jMMMM jYYYY';
    }
    return 'MMMM YYYY';
  }

  renderDay(day, id) {
    const minDate = parseDate(this.props.type, this.props.minDate);
    const maxDate = parseDate(this.props.type, this.props.maxDate);
    let state = '';
    if (this.props.disabledByDefault) {
      state = 'disabled';
    } else if (
      (minDate && !dateutils.isGTE(this.props.type, day, minDate)) ||
      (maxDate && !dateutils.isLTE(this.props.type, day, maxDate))
    ) {
      state = 'disabled';
    } else if (
      !dateutils.sameMonth(this.props.type, day, this.state.currentMonth)
    ) {
      state = 'disabled';
    } else if (dateutils.sameDate(this.props.type, day, Moment())) {
      state = 'today';
    }
    if (
      !dateutils.sameMonth(this.props.type, day, this.state.currentMonth) &&
      this.props.hideExtraDays
    ) {
      return <View key={id} style={{ flex: 1 }} />;
    }
    const DayComp = this.getDayComponent();
    let date;
    if (this.props.type === 'jalaali') {
      date = day.jDate();
    } else {
      date = day.date();
    }
    return (
      <View style={{ flex: 1, alignItems: 'center' }} key={id}>
        <DayComp
          key={id}
          state={state}
          type={this.props.type}
          theme={this.props.theme}
          rtl={this.props.rtl}
          onPress={this.pressDay}
          onLongPress={this.longPressDay}
          date={xdateToData(this.props.type, day)}
          marking={this.getDateMarking(day)}
        >
          {date}
        </DayComp>
      </View>
    );
  }

  getDayComponent() {
    if (this.props.dayComponent) {
      return this.props.dayComponent;
    }

    switch (this.props.markingType) {
      case 'period':
        return UnitDay;
      case 'multi-dot':
        return MultiDotDay;
      case 'multi-period':
        return MultiPeriodDay;
      case 'custom':
        return SingleDay;
      default:
        return Day;
    }
  }

  getDateMarking(day) {
    if (!this.props.markedDates) {
      return false;
    }
    const dates =
      this.props.markedDates[day.format('YYYY-MM-DD')] || EmptyArray;
    if (dates.length || dates) {
      return dates;
    } else {
      return false;
    }
  }

  renderWeekNumber(weekNumber) {
    return (
      <Day
        key={`week-${weekNumber}`}
        type={this.props.type}
        theme={this.props.theme}
        marking={{ disableTouchEvent: true }}
        state="disabled"
      >
        {weekNumber}
      </Day>
    );
  }

  renderWeek(days, id) {
    const week = [];
    days.forEach((day, id2) => {
      week.push(this.renderDay(day, id2));
    }, this);

    if (this.props.showWeekNumbers) {
      if (this.props.type === 'jalaali') {
        week.unshift(this.renderWeekNumber(days[days.length - 1].jWeek()));
      } else {
        week.unshift(this.renderWeekNumber(days[days.length - 1].isoWeek()));
      }
    }

    return (
      <View style={this.style.week} key={id}>
        {week}
      </View>
    );
  }

  render() {
    const days = dateutils.page(
      this.props.type,
      this.state.currentMonth,
      this.props.firstDay,
    );
    const weeks = [];
    while (days.length) {
      weeks.push(this.renderWeek(days.splice(0, 7), weeks.length));
    }
    let indicator;
    const current = parseDate(this.props.type, this.props.current);
    if (current) {
      const lastMonthOfDay = current
        .clone()
        .add(1, 'months')
        .date(1)
        .add(-1, 'days')
        .format('YYYY-MM-DD');
      if (
        this.props.displayLoadingIndicator &&
        !(this.props.markedDates && this.props.markedDates[lastMonthOfDay])
      ) {
        indicator = true;
      }
    }
    return (
      <View style={[this.style.container, this.props.style]}>
        <CalendarHeader
          type={this.props.type}
          theme={this.props.theme}
          rtl={this.props.rtl}
          hideArrows={this.props.hideArrows}
          month={this.state.currentMonth}
          addMonth={this.addMonth}
          showIndicator={indicator}
          firstDay={this.props.firstDay}
          renderArrow={this.props.renderArrow}
          monthFormat={this.monthFormat()}
          hideDayNames={this.props.hideDayNames}
          weekNumbers={this.props.showWeekNumbers}
          onPressArrowLeft={this.props.onPressArrowLeft}
          onPressArrowRight={this.props.onPressArrowRight}
        />
        <View style={this.style.monthView}>{weeks}</View>
      </View>
    );
  }
}

const STYLESHEET_ID = 'stylesheet.calendar.main';

function styleConstructor(theme = {}, { rtl, type }) {
  const appStyle = { ...defaultStyle, ...theme };
  if (rtl === undefined) {
    if (type === 'jalaali') {
      rtl = true;
    } else {
      rtl = false;
    }
  }
  return StyleSheet.create({
    container: {
      paddingLeft: 5,
      paddingRight: 5,
      backgroundColor: appStyle.calendarBackground,
    },
    monthView: {
      backgroundColor: appStyle.calendarBackground,
    },
    week: {
      marginTop: 7,
      marginBottom: 7,
      flexDirection: rtl ? 'row-reverse' : 'row',
      justifyContent: 'space-around',
    },
    ...(theme[STYLESHEET_ID] || {}),
  });
}

module.exports = Calendar;
