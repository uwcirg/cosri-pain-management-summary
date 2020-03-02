import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
//import Video from '../elements/Video';


export default class Video extends Component {
  constructor(props) {
    super(props);
    this.state = {isToggleOn: false};
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
      title, className, src, toggleable
    } = this.props;
    const VideoElement = ({ videoSrc, title }) => {
      return (
          <div
            className="video"
            style={{
              position: "relative",
              paddingBottom: "56.25%" /* 16:9 */,
              height: 0
            }}
          >
            <iframe
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%"
              }}
              title={title}
              src={`${videoSrc}`}
              frameBorder="0"
              allowFullScreen
            />
          </div>
      );
    };
  
    if (!toggleable) {
      return (<VideoElement videoSrc={src} title={title} />);
    }
    return (
      <div>
        <span title={title} onClick={this.handleClick} className={`${className} video-link`}>{title}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`${this.state.isToggleOn?'hide': 'show-inline'} link-toggle`}
          onClick={this.handleClick}
        />
        <FontAwesomeIcon
          icon={faChevronUp}
          className={`${this.state.isToggleOn?'show-inline': 'hide'} link-toggle`}
          onClick={this.handleClick}
        />
        <div className={`${this.state.isToggleOn?'show': 'hide'} video-container`}>
          <VideoElement videoSrc={src} title={title} />
        </div>
      </div>
    );
  }
}

Video.propTypes = {
  title: PropTypes.string.isRequired,
  src: PropTypes.string.isRequired,
  className: PropTypes.string,
  toggleable: PropTypes.bool
};
