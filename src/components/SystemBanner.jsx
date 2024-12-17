import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class SystemBanner extends Component {
  render() {
    return (
      <div
        className="system-banner"
        role="banner">
          {this.props.type} version - not for clinical use
      </div>
    );
  }
}

SystemBanner.propTypes = {
  type: PropTypes.string.isRequired
};
