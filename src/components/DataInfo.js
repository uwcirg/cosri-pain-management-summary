import React, { Component } from 'react';
import PropTypes from 'prop-types';

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
        queryDateTime
    } = this.props;
    return (
        <div className="data-provenance">
            <div className="title">
                <button onClick={this.handleClick}>[data info]</button>
            </div>
            <div className={`${this.state.isToggleOn?'show': 'hide'} content`}>
                <div className={`${contentText?'show':'hide'} text`}><b>{'Data Provenance:'}</b> {contentText}</div>
                <div className={'query-info'}>{`${'The query was executed at: ' + queryDateTime}`}</div>
            </div>
        </div>
    );
  }
}
DataInfo.propTypes = {
    contentText: PropTypes.string,
    queryDateTime: PropTypes.string.isRequired
};
