/**
 * Copyright 2016 Reza (github.com/rghorbani)
 *
 * @flow
 */

'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');
const { Text } = require('react-native');
const {
  Button,
  Constants,
  Colors,
  Picker,
  View,
} = require('react-native-common');

const DatePickerModal = require('./DatePickerModal');
const Calendar = require('../calendar');

const ItemType = PropTypes.shape({
  year: PropTypes.number,
  month: PropTypes.number,
  day: PropTypes.number,
  timestamp: PropTypes.number,
  dateString: PropTypes.string,
});

class DatePicker extends Picker {
  static displayName = 'DatePicker';

  static propTypes = {
    ...Picker.propTypes,
    /**
     * picker current value in the shape of {value: ..., label: ...}, for custom shape use 'getItemValue' prop
     */
    value: PropTypes.oneOfType([
      ItemType,
      PropTypes.arrayOf(ItemType),
      PropTypes.object,
    ]),
  };

  static defaultProps = {
    ...Picker.defaultProps,
  };

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      showModal: false,
    };
  }

  toggleItemSelection(item) {
    const { value } = this.state;
    const newValue = _.xorBy(value, [item], 'value');
    this.setState({
      value: newValue,
    });
  }

  onDoneSelecting(date, localDate) {
    this.onChangeText(localDate);
    this.toggleExpandableModal(false);
    this.props.onChange && this.props.onChange(date, localDate);
  }

  cancelSelect() {
    this.setState({
      value: this.props.value,
    });
    this.toggleExpandableModal(false);
  }

  getLabel() {
    const { value } = this.state;
    if (_.isArray(value)) {
      return _.chain(value)
        .map('label')
        .join(' - ')
        .value();
    }
    return _.get(value, 'dateString');
  }

  handlePickerOnPress() {
    this.toggleExpandableModal(true);
    this.props.onPress && this.props.onPress();
  }

  renderExpandableInput() {
    const { value } = this.state;
    const { placeholder, style } = this.props;
    const typography = this.getTypography();
    const color = this.extractColorValue() || Colors.dark10;
    const label = this.getLabel();
    const shouldShowPlaceholder = _.isEmpty(value);

    return (
      <Text
        style={[
          this.styles.input,
          typography,
          { color },
          style,
          { height: Constants.isAndroid ? typography.lineHeight : undefined },
          shouldShowPlaceholder && this.styles.placeholder,
        ]}
        numberOfLines={3}
        onPress={this.handlePickerOnPress}
      >
        {shouldShowPlaceholder ? placeholder : label}
      </Text>
    );
  }

  renderExpandableModal() {
    const { enableModalBlur, topBarProps, calendarProps } = this.props;
    const { showExpandableModal } = this.state;
    return (
      <DatePickerModal
        visible={showExpandableModal}
        enableModalBlur={enableModalBlur}
        topBarProps={{
          ...topBarProps,
          onCancel: this.cancelSelect,
        }}
      >
        <Calendar {...calendarProps} onDayPress={this.onDoneSelecting} />
      </DatePickerModal>
    );
  }

  render() {
    const { renderPicker, testID } = this.props;
    if (_.isFunction(renderPicker)) {
      const { value } = this.state;
      return (
        <View left>
          <Button link onPress={this.handlePickerOnPress} testID={testID}>
            {renderPicker(value)}
          </Button>
          {this.renderExpandableModal()}
        </View>
      );
    }

    return super.render();
  }
}

module.exports = DatePicker;
