import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import ChevronDownIcon from "../icons/ChevronDownIcon";
import { isEmptyArray } from "../helpers/utility";

export default class ErrorBanner extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      displayed: true,
    };
    this.handleCloseToggle = this.handleCloseToggle.bind(this);
  }

  handleClose = () => {
    this.setState({ displayed: false });
  };

  handleCloseToggle(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState((state) => ({
      displayed: !state.displayed,
    }));
  }

  render() {
    if (isEmptyArray(this.props.errors)) return null;
    const conditionalClass = this.state.displayed ? "" : "close";
    return (
      <div
        className={`error-banner ${conditionalClass}`}
        role="link"
        onClick={this.handleCloseToggle}
        onKeyUp={this.handleCloseToggle}
        tabIndex={0}
      >
        <ChevronDownIcon
          className="close-button"
          icon="times"
          title="close"
          onClick={this.handleCloseToggle}
          width="25"
          height="25"
        />
        <h4 className="error-banner__title">
          <FontAwesomeIcon
            className="icon"
            icon={faExclamationCircle}
            title="notice"
          />{" "}
          Application Errors
        </h4>
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
  errors: PropTypes.array.isRequired,
};
