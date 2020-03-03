import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import IframeElement from '../elements/Iframe';


export default class Video extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isToggleOn: false
    };
    // This binding is necessary to make `this` work in the callback
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.preventDefault();
    this.setState(state => ({
      isToggleOn: !state.isToggleOn
    }));
  }

  render() {
    const {
      title, src, toggleable
    } = this.props;

    /*
     * responsive iframe style
     */
    const IframeStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%'
    };

    const VideoContainerStyle = {
      position: 'relative',
      paddingBottom: '56.25%' /* 16:9 */,
      height: 0
    };

    if (!toggleable) {
      return (<IframeElement src={src} title={title} style={IframeStyle} />);
    }
    return (
      <div>
        {/* element for toggling the visibility of video */}
        <span title={title} onClick={this.handleClick} className='video-link'>{title}</span>
        <ChevronDownIcon
          className={`${this.state.isToggleOn?'open': ''} link-toggle`}
          onClick={this.handleClick}
          width='15'
          height='15'
        />
        <div className={`${this.state.isToggleOn?'show': 'hide'} video-container`}>
          <div
            className='video'
            style={VideoContainerStyle}
          >
            <IframeElement src={src} title={title} style={IframeStyle} />
          </div>
        </div>
      </div>
    );
  }
}
Video.propTypes = {
  title: PropTypes.string.isRequired,
  src: PropTypes.string.isRequired,
  toggleable: PropTypes.bool
};
