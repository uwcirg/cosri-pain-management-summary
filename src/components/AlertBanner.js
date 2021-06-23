import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ChevronDownIcon from '../icons/ChevronDownIcon';

export default class AlertBanner extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      displayed: true
    };
    this.handleCloseToggle= this.handleCloseToggle.bind(this);
  }

  handleClose = () => {
    this.setState({ displayed: false });
  }

  handleCloseToggle(e) {
    e.preventDefault();
    this.setState(state => ({
      displayed: !state.displayed
    }));
  }

  render() {
    const conditionalClass = this.state.displayed ? '': 'close';
    return (
      <div
        className={`alert-banner ${conditionalClass}`}
        role="banner">
        <ChevronDownIcon className="close-button" icon="times" title="close" onClick={this.handleCloseToggle} width="25" height="25" />
        <div className="alert-banner__description">
            this is an alert banner
        </div>
      </div>
    );
  }
}

AlertBanner.propTypes = {
    messageCollection: PropTypes.array
};
