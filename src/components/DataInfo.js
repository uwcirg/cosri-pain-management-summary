import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default class DataInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {isToggleOn: false};
    // This binding is necessary to make `this` work in the callback
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState(state => ({
      isToggleOn: !state.isToggleOn
    }));
  }

  render() {
    const {
        contentText,
        queryDateTime,
        errorMessage,
        warningText
    } = this.props;
    const hasContent = contentText || errorMessage || warningText;
    return (
        <div className="data-provenance">
            <div className="title">
                <span className="query-text">{`The query was last executed at ${queryDateTime}.`}</span>
                <button onClick={this.handleClick}  className={`${hasContent?'show-inline':'hide'}`}><span>[see additional data quality information]</span></button>
                <span className={`${errorMessage?'show-inline':'hide'} error`} onClick={this.handleClick}>
                  <FontAwesomeIcon
                    className="error"
                    icon="exclamation-circle"
                    title="data loading error"
                    role="tooltip"
                    tabIndex={0}
                  />
                </span>
            </div>
            <div className={`${this.state.isToggleOn?'display': ''} content`}>
                <div className={`${contentText?'show':'hide'} text`}><b>{'Data Provenance:'}</b> {contentText}</div>
                <div className={`${errorMessage?'show':'hide'} error`}>{errorMessage}</div>
                <div className={`${warningText?'show':'hide'} flag-text`}>{warningText}</div>
                <div className={'query-info'}><b>{'The query was last executed at: '}</b> {`${queryDateTime}`}</div>
            </div>
        </div>
    );
  }
}
DataInfo.propTypes = {
    contentText: PropTypes.string,
    warningText: PropTypes.string,
    queryDateTime: PropTypes.string.isRequired,
    errorMessage: PropTypes.string
};
