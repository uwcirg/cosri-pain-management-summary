import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ChevronDownIcon from '../icons/ChevronDownIcon';

export default class ErrorBanner extends Component {
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
    e.stopPropagation();
    this.setState(state => ({
      displayed: !state.displayed
    }));
  }

  render() {
    const conditionalClass = this.state.displayed ? '': 'close';
    return (
      <div
        className={`error-banner ${conditionalClass}`}
        role="banner">
        <ChevronDownIcon className="close-button" icon="times" title="close" onClick={this.handleCloseToggle} width="25" height="25" />
        <h4 className="error-banner__title" onClick={this.handleCloseToggle}><FontAwesomeIcon className="icon" icon="exclamation-circle" title="notice"/> Application Errors</h4>
        <div className="error-banner__description">
            <ul>
            {this.props.errors.map((item, index) => {
              return <li key={`"app_error_"+${index}`} dangerouslySetInnerHTML={{__html: item}}></li>
            })}
            </ul>
        </div>
      </div>
    );
  }
}

ErrorBanner.propTypes = {
  errors: PropTypes.array.isRequired
};
