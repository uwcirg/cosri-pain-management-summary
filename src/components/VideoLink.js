import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp} from '@fortawesome/free-solid-svg-icons';
import { faChevronDown} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import Video from '../elements/Video';


export default class Link extends Component {
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
      linkTitle, className, videoID
    } = this.props;

    return (
      <div>
        <a  href={() => {return false;}} title={linkTitle} onClick={this.handleClick} className={`${className} video-link`} target='_blank' rel='noopener noreferrer'>{linkTitle}</a>
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
          <Video youtubeId={videoID} title={linkTitle}></Video>
        </div>
      </div>
    );
  }
}

Link.propTypes = {
  linkTitle: PropTypes.string.isRequired,
  linkURL: PropTypes.string.isRequired,
  className: PropTypes.string,
  videoID: PropTypes.string
};
