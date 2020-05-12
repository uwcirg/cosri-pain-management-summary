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
        className={`exclusion-banner banner ${conditionalClass}`}
        role="banner">
        {/* <FontAwesomeIcon className="close-button" icon="times" title="close" onClick={this.handleClose} /> */}
        <ChevronDownIcon className="close-button" icon="times" title="close" onClick={this.handleCloseToggle} width="25" height="25" />

        <div className="exclusion-banner__description">
          <strong><FontAwesomeIcon icon="exclamation-circle" title="notice" /> LIMITATIONS</strong>
          <p className="content">This guidance is <b><u>not intended</u></b> to apply to patients undergoing <b>end-of-life care (hospice or palliative)</b>, <b>inpatient treatment</b>, or <b>active cancer treatment</b>. However, some suggestions may be helpful in managing any patient.</p>
        </div>
      </div>
    );
  }
}
