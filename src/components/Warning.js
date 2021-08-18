import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ChevronDownIcon from '../icons/ChevronDownIcon';

export default class ExclusionBanner extends Component {
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
        className={`exclusion-banner banner addon-text warning ${conditionalClass}`}
        role="banner"
        onClick={this.handleCloseToggle}>
        <ChevronDownIcon className="close-button" icon="times" title="close"  width="25" height="25" />

        <div className="exclusion-banner__description warning">
          <strong className="title"><FontAwesomeIcon icon="exclamation-circle" title="notice" /> WARNING</strong> <span className="content">{this.props.text}</span>
        </div>
      </div>
    );
  }
}
