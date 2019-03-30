/**
 * Copyright 2016 Reza (github.com/rghorbani)
 *
 * @flow
 */

'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { ScrollView, StyleSheet, View } = require('react-native');
const { BaseComponent, Constants, Modal } = require('react-native-common');

class DatePickerModal extends BaseComponent {
  static displayName = 'IGNORE';

  static propTypes = {
    ...Modal.propTypes,
    topBarProps: PropTypes.shape(Modal.TopBar.propTypes),
  };

  generateStyles() {
    this.styles = createStyles(this.props);
  }

  render() {
    const { visible, enableModalBlur, topBarProps, children } = this.props;
    return (
      <Modal
        animationType={'slide'}
        transparent={Constants.isIOS && enableModalBlur}
        enableModalBlur={Constants.isIOS && enableModalBlur}
        visible={visible}
        onRequestClose={topBarProps.onCancel}
      >
        <Modal.TopBar {...topBarProps} />
        <ScrollView keyboardShouldPersistTaps="always">
          <View style={this.styles.modalBody}>{children}</View>
        </ScrollView>
      </Modal>
    );
  }
}

function createStyles() {
  return StyleSheet.create({
    modalBody: {
      paddingTop: 10,
    },
  });
}

module.exports = DatePickerModal;
