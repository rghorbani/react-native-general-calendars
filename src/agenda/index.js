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
const {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
  ViewPropTypes,
} = require('react-native');

const CalendarList = require('../calendar-list');
const ReservationsList = require('./reservation-list');
const dateutils = require('../dateutils');
const VelocityTracker = require('../input');
const { parseDate, xdateToData } = require('../interface');
const defaultStyle = require('../style');
const platformStyles = require('./platform-style');

const HEADER_HEIGHT = 104;
const KNOB_HEIGHT = 24;

// Fallback when RN version is < 0.44
const viewPropTypes = ViewPropTypes || View.propTypes;

class AgendaView extends React.Component {
  static propTypes = {
    // Calendar type
    type: PropTypes.oneOf(['gregorian', 'jalaali']),

    // Specify theme properties to override specific styles for calendar parts. Default = {}
    theme: PropTypes.object,

    // agenda container style
    style: viewPropTypes.style,

    // the list of items that have to be displayed in agenda. If you want to render item as empty date
    // the value of date key has to be an empty array []. If there exists no value for date key it is
    // considered that the date in question is not yet loaded
    items: PropTypes.object,

    // callback that gets called when items for a certain month should be loaded (month became visible)
    loadItemsForMonth: PropTypes.func,
    // callback that fires when the calendar is opened or closed
    onCalendarToggled: PropTypes.func,
    // callback that gets called on day press
    onDayPress: PropTypes.func,
    // callback that gets called when day changes while scrolling agenda list
    onDaychange: PropTypes.func,
    // specify how each item should be rendered in agenda
    renderItem: PropTypes.func,
    // specify how each date should be rendered. day can be undefined if the item is not first in that day.
    renderDay: PropTypes.func,
    // specify how agenda knob should look like
    renderKnob: PropTypes.func,
    // specify how empty date content with no items should be rendered
    renderEmptyDay: PropTypes.func,
    // specify what should be rendered instead of ActivityIndicator
    renderEmptyData: PropTypes.func,
    // specify your item comparison function for increased performance
    rowHasChanged: PropTypes.func,

    // Max amount of months allowed to scroll to the past. Default = 50
    pastScrollRange: PropTypes.number,

    // Max amount of months allowed to scroll to the future. Default = 50
    futureScrollRange: PropTypes.number,

    // initially selected day
    selected: PropTypes.any,
    // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
    minDate: PropTypes.any,
    // Maximum date that can be selected, dates after maxDate will be grayed out. Default = undefined
    maxDate: PropTypes.any,

    // If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday.
    firstDay: PropTypes.number,

    // Collection of dates that have to be marked. Default = items
    markedDates: PropTypes.object,
    // Optional marking type if custom markedDates are provided
    markingType: PropTypes.string,

    // Hide knob button. Default = false
    hideKnob: PropTypes.bool,
    // Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
    monthFormat: PropTypes.string,
    // A RefreshControl component, used to provide pull-to-refresh functionality for the ScrollView.
    refreshControl: PropTypes.element,
    // If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make sure to also set the refreshing prop correctly.
    onRefresh: PropTypes.func,
    // Set this true while waiting for new data from a refresh.
    refreshing: PropTypes.bool,
    // Display loading indicador. Default = false
    displayLoadingIndicator: PropTypes.bool,
  };

  static defaultProps = {
    type: 'gregorian',
  };

  constructor(props) {
    super(props);
    this.styles = styleConstructor(props.theme);
    const windowSize = Dimensions.get('window');
    this.viewHeight = windowSize.height;
    this.viewWidth = windowSize.width;
    this.scrollTimeout = undefined;
    this.headerState = 'idle';
    let selectedDay;
    let topDay;
    if (props.type === 'jalaali') {
      selectedDay = jMoment.utc();
      topDay = jMoment.utc();
    } else {
      selectedDay = Moment.utc();
      topDay = Moment.utc();
    }
    this.state = {
      scrollY: new Animated.Value(0),
      calendarIsReady: false,
      calendarScrollable: false,
      firstResevationLoad: false,
      selectedDay: parseDate(props.type, props.selected) || selectedDay,
      topDay: parseDate(props.type, props.selected) || topDay,
    };
    this.currentMonth = this.state.selectedDay.clone();
    this.onLayout = this.onLayout.bind(this);
    this.onDayChange = this.onDayChange.bind(this);
    this.onVisibleMonthsChange = this.onVisibleMonthsChange.bind(this);
    this.onScrollPadLayout = this.onScrollPadLayout.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onStartDrag = this.onStartDrag.bind(this);
    this.onSnapAfterDrag = this.onSnapAfterDrag.bind(this);
    this.generateMarkings = this.generateMarkings.bind(this);
    this.knobTracker = new VelocityTracker();
    this.state.scrollY.addListener(({ value }) => this.knobTracker.add(value));
  }

  calendarOffset() {
    return 90 - this.viewHeight / 2;
  }

  initialScrollPadPosition() {
    return Math.max(0, this.viewHeight - HEADER_HEIGHT);
  }

  setScrollPadPosition(y, animated) {
    this.scrollPad._component.scrollTo({ x: 0, y, animated });
  }

  onScrollPadLayout() {
    // When user touches knob, the actual component that receives touch events is a ScrollView.
    // It needs to be scrolled to the bottom, so that when user moves finger downwards,
    // scroll position actually changes (it would stay at 0, when scrolled to the top).
    this.setScrollPadPosition(this.initialScrollPadPosition(), false);
    // delay rendering calendar in full height because otherwise it still flickers sometimes
    setTimeout(() => this.setState({ calendarIsReady: true }), 0);
  }

  onLayout(event) {
    this.viewHeight = event.nativeEvent.layout.height;
    this.viewWidth = event.nativeEvent.layout.width;
    this.forceUpdate();
  }

  onTouchStart() {
    this.headerState = 'touched';
    if (this.knob) {
      this.knob.setNativeProps({ style: { opacity: 0.5 } });
    }
  }

  onTouchEnd() {
    if (this.knob) {
      this.knob.setNativeProps({ style: { opacity: 1 } });
    }

    if (this.headerState === 'touched') {
      this.setScrollPadPosition(0, true);
      this.enableCalendarScrolling();
    }
    this.headerState = 'idle';
  }

  onStartDrag() {
    this.headerState = 'dragged';
    this.knobTracker.reset();
  }

  onSnapAfterDrag(e) {
    // on Android onTouchEnd is not called if dragging was started
    this.onTouchEnd();
    const currentY = e.nativeEvent.contentOffset.y;
    this.knobTracker.add(currentY);
    const projectedY = currentY + this.knobTracker.estimateSpeed() * 250; /*ms*/
    const maxY = this.initialScrollPadPosition();
    const snapY = projectedY > maxY / 2 ? maxY : 0;
    this.setScrollPadPosition(snapY, true);
    if (snapY === 0) {
      this.enableCalendarScrolling();
    }
  }

  onVisibleMonthsChange(months) {
    if (this.props.items && !this.state.firstResevationLoad) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        if (this.props.loadItemsForMonth && this._isMounted) {
          this.props.loadItemsForMonth(months[0]);
        }
      }, 200);
    }
  }

  loadReservations(props) {
    if (
      (!props.items || !Object.keys(props.items).length) &&
      !this.state.firstResevationLoad
    ) {
      this.setState(
        {
          firstResevationLoad: true,
        },
        () => {
          if (this.props.loadItemsForMonth) {
            this.props.loadItemsForMonth(
              xdateToData(this.props.type, this.state.selectedDay),
            );
          }
        },
      );
    }
  }

  UNSAFE_componentWillMount() {
    this._isMounted = true;
    this.loadReservations(this.props);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  UNSAFE_componentWillReceiveProps(props) {
    if (props.items) {
      this.setState({
        firstResevationLoad: false,
      });
    } else {
      this.loadReservations(props);
    }
  }

  enableCalendarScrolling() {
    this.setState({
      calendarScrollable: true,
    });
    if (this.props.onCalendarToggled) {
      this.props.onCalendarToggled(true);
    }
    // Enlarge calendarOffset here as a workaround on iOS to force repaint.
    // Otherwise the month after current one or before current one remains invisible.
    // The problem is caused by overflow: 'hidden' style, which we need for dragging
    // to be performant.
    // Another working solution for this bug would be to set removeClippedSubviews={false}
    // in CalendarList listView, but that might impact performance when scrolling
    // month list in expanded CalendarList.
    // Further info https://github.com/facebook/react-native/issues/1831
    this.calendar.scrollToDay(
      this.state.selectedDay,
      this.calendarOffset() + 1,
      true,
    );
  }

  _chooseDayFromCalendar(d) {
    this.chooseDay(d, !this.state.calendarScrollable);
  }

  chooseDay(d, optimisticScroll) {
    const day = parseDate(this.props.type, d);
    this.setState({
      calendarScrollable: false,
      selectedDay: day.clone(),
    });
    if (this.props.onCalendarToggled) {
      this.props.onCalendarToggled(false);
    }
    if (!optimisticScroll) {
      this.setState({
        topDay: day.clone(),
      });
    }
    this.setScrollPadPosition(this.initialScrollPadPosition(), true);
    this.calendar.scrollToDay(day, this.calendarOffset(), true);
    if (this.props.loadItemsForMonth) {
      this.props.loadItemsForMonth(xdateToData(this.props.type, day));
    }
    if (this.props.onDayPress) {
      this.props.onDayPress(xdateToData(this.props.type, day));
    }
  }

  renderReservations() {
    return (
      <ReservationsList
        refreshControl={this.props.refreshControl}
        refreshing={this.props.refreshing}
        onRefresh={this.props.onRefresh}
        rowHasChanged={this.props.rowHasChanged}
        renderItem={this.props.renderItem}
        renderDay={this.props.renderDay}
        renderEmptyDate={this.props.renderEmptyDate}
        reservations={this.props.items}
        selectedDay={this.state.selectedDay}
        renderEmptyData={this.props.renderEmptyData}
        topDay={this.state.topDay}
        onDayChange={this.onDayChange}
        onScroll={() => {}}
        ref={c => (this.list = c)}
        theme={this.props.theme}
        type={this.props.type}
      />
    );
  }

  onDayChange(day) {
    const newDate = parseDate(this.props.type, day);
    const withAnimation = dateutils.sameMonth(
      this.props.type,
      newDate,
      this.state.selectedDay,
    );
    this.calendar.scrollToDay(day, this.calendarOffset(), withAnimation);
    this.setState({
      selectedDay: parseDate(this.props.type, day),
    });

    if (this.props.onDayChange) {
      this.props.onDayChange(xdateToData(this.props.type, newDate));
    }
  }

  generateMarkings() {
    let markings = this.props.markedDates;
    if (!markings) {
      markings = {};
      Object.keys(this.props.items || {}).forEach(key => {
        if (this.props.items[key] && this.props.items[key].length) {
          markings[key] = { marked: true };
        }
      });
    }
    const key = this.state.selectedDay.format('YYYY-MM-DD');
    return {
      ...markings,
      [key]: { ...(markings[key] || {}), ...{ selected: true } },
    };
  }

  render() {
    const agendaHeight = Math.max(0, this.viewHeight - HEADER_HEIGHT);
    const weekDaysNames = dateutils.weekDayNames(
      this.props.type,
      this.props.firstDay,
    );
    const weekdaysStyle = [
      this.styles.weekdays,
      {
        opacity: this.state.scrollY.interpolate({
          inputRange: [agendaHeight - HEADER_HEIGHT, agendaHeight],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
        transform: [
          {
            translateY: this.state.scrollY.interpolate({
              inputRange: [
                Math.max(0, agendaHeight - HEADER_HEIGHT),
                agendaHeight,
              ],
              outputRange: [-HEADER_HEIGHT, 0],
              extrapolate: 'clamp',
            }),
          },
        ],
      },
    ];

    const headerTranslate = this.state.scrollY.interpolate({
      inputRange: [0, agendaHeight],
      outputRange: [agendaHeight, 0],
      extrapolate: 'clamp',
    });

    const contentTranslate = this.state.scrollY.interpolate({
      inputRange: [0, agendaHeight],
      outputRange: [0, agendaHeight / 2],
      extrapolate: 'clamp',
    });

    const headerStyle = [
      this.styles.header,
      { bottom: agendaHeight, transform: [{ translateY: headerTranslate }] },
    ];

    if (!this.state.calendarIsReady) {
      // limit header height until everything is setup for calendar dragging
      headerStyle.push({ height: 0 });
      // fill header with appStyle.calendarBackground background to reduce flickering
      weekdaysStyle.push({ height: HEADER_HEIGHT });
    }

    const shouldAllowDragging =
      !this.props.hideKnob && !this.state.calendarScrollable;
    const scrollPadPosition =
      (shouldAllowDragging ? HEADER_HEIGHT : 0) - KNOB_HEIGHT;

    const scrollPadStyle = {
      position: 'absolute',
      width: 80,
      height: KNOB_HEIGHT,
      top: scrollPadPosition,
      left: (this.viewWidth - 80) / 2,
    };

    let knob = <View style={this.styles.knobContainer} />;

    if (!this.props.hideKnob) {
      const knobView = this.props.renderKnob ? (
        this.props.renderKnob()
      ) : (
        <View style={this.styles.knob} />
      );
      knob = this.state.calendarScrollable ? null : (
        <View style={this.styles.knobContainer}>
          <View ref={c => (this.knob = c)}>{knobView}</View>
        </View>
      );
    }

    return (
      <View
        onLayout={this.onLayout}
        style={[this.props.style, { flex: 1, overflow: 'hidden' }]}
      >
        <View style={this.styles.reservations}>
          {this.renderReservations()}
        </View>
        <Animated.View style={headerStyle}>
          <Animated.View
            style={{ flex: 1, transform: [{ translateY: contentTranslate }] }}
          >
            <CalendarList
              ref={c => (this.calendar = c)}
              onLayout={() => {
                this.calendar.scrollToDay(
                  this.state.selectedDay.clone(),
                  this.calendarOffset(),
                  false,
                );
              }}
              type={this.props.type}
              calendarWidth={this.viewWidth}
              theme={this.props.theme}
              onVisibleMonthsChange={this.onVisibleMonthsChange}
              minDate={this.props.minDate}
              maxDate={this.props.maxDate}
              current={this.currentMonth}
              markedDates={this.generateMarkings()}
              markingType={this.props.markingType}
              removeClippedSubviews={this.props.removeClippedSubviews}
              onDayPress={this._chooseDayFromCalendar.bind(this)}
              scrollingEnabled={this.state.calendarScrollable}
              hideExtraDays={this.state.calendarScrollable}
              firstDay={this.props.firstDay}
              monthFormat={this.props.monthFormat}
              pastScrollRange={this.props.pastScrollRange}
              futureScrollRange={this.props.futureScrollRange}
              dayComponent={this.props.dayComponent}
              disabledByDefault={this.props.disabledByDefault}
              displayLoadingIndicator={this.props.displayLoadingIndicator}
              showWeekNumbers={this.props.showWeekNumbers}
            />
          </Animated.View>
          {knob}
        </Animated.View>
        <Animated.View style={weekdaysStyle}>
          {this.props.showWeekNumbers && (
            <Text
              allowFontScaling={false}
              style={this.styles.weekday}
              numberOfLines={1}
            />
          )}
          {weekDaysNames.map((day, index) => (
            <Text
              allowFontScaling={false}
              key={day + index}
              style={this.styles.weekday}
              numberOfLines={1}
            >
              {day}
            </Text>
          ))}
        </Animated.View>
        <Animated.ScrollView
          ref={c => (this.scrollPad = c)}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          style={scrollPadStyle}
          scrollEventThrottle={1}
          scrollsToTop={false}
          onTouchStart={this.onTouchStart}
          onTouchEnd={this.onTouchEnd}
          onScrollBeginDrag={this.onStartDrag}
          onScrollEndDrag={this.onSnapAfterDrag}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: this.state.scrollY } } }],
            { useNativeDriver: true },
          )}
        >
          <View
            style={{ height: agendaHeight + KNOB_HEIGHT }}
            onLayout={this.onScrollPadLayout}
          />
        </Animated.ScrollView>
      </View>
    );
  }
}

const STYLESHEET_ID = 'stylesheet.agenda.main';

function styleConstructor(theme = {}) {
  const appStyle = { ...defaultStyle, ...theme };
  const { knob, weekdays } = platformStyles(appStyle);
  return StyleSheet.create({
    knob,
    weekdays,
    header: {
      overflow: 'hidden',
      justifyContent: 'flex-end',
      position: 'absolute',
      height: '100%',
      width: '100%',
    },
    calendar: {
      flex: 1,
      borderBottomWidth: 1,
      borderColor: appStyle.separatorColor,
    },
    knobContainer: {
      flex: 1,
      position: 'absolute',
      left: 0,
      right: 0,
      height: 24,
      bottom: 0,
      alignItems: 'center',
      backgroundColor: appStyle.calendarBackground,
    },
    weekday: {
      width: 32,
      textAlign: 'center',
      fontSize: 13,
      color: appStyle.textSectionTitleColor,
    },
    reservations: {
      flex: 1,
      marginTop: 104,
      backgroundColor: appStyle.backgroundColor,
    },
    ...(theme[STYLESHEET_ID] || {}),
  });
}

module.exports = AgendaView;
