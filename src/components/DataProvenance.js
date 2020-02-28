import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class DataProvenance extends Component {
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
        queryDateTime
    } = this.props;
    return (
        <div className="data-provenance">
            <div className="title">
                {'data quality info'}
                <button onClick={this.handleClick}>[show/hide]</button>
            </div>
            <div className={`${this.state.isToggleOn?'show': 'hide'} content`}>
                <b>{'Data Provenance:'}</b> {contentText}
                <div>{`${'The query was executed at: ' + queryDateTime}`}</div>
            </div>
        </div>
    );
  }
}
DataProvenance.propTypes = {
    contentText: PropTypes.string.isRequired,
    queryDateTime: PropTypes.string.isRequired
};
