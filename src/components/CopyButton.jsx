import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import {
  addButtonErrorStateTransition,
  addButtonSuccessStateTransition,
  allowCopyClipboardItem,
  copyDomToClipboard,
} from "../helpers/utility";
export default class CopyButton extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      copyInProgress: false,
    };
    this.handleCopy = this.handleCopy.bind(this);
    this.copyButtonRef = React.createRef();
  }
  handleCopy() {
    if (!allowCopyClipboardItem()) return;
    if (!(this.props.elementToCopy || this.props.buildElementForCopy)) return;
    copyDomToClipboard(
      this.props.buildElementForCopy
        ? this.props.buildElementForCopy()
        : this.props.elementToCopy,
      {
        beforeCopy: () => {
          this.setState(
            {
              copyInProgress: true,
            },
            () => {
              if (!this.props.disableFrame && this.props.elementToCopy)
                this.props.elementToCopy.classList.add("framed-border");
              if (this.props.beforeCopy) {
                this.props.beforeCopy();
              }
            }
          );
        },
        afterCopy: (error) => {
          this.setState(
            {
              copyInProgress: false,
            },
            () => {
              if (this.props.afterCopy) {
                this.props.afterCopy();
              }
              if (!this.props.disableFrame && this.props.elementToCopy)
                this.props.elementToCopy.classList.remove("framed-border");
              if (error) {
                addButtonErrorStateTransition(this.copyButtonRef.current);
                return;
              }
              addButtonSuccessStateTransition(this.copyButtonRef.current);
            }
          );
        },
        filter: (node) => {
          const exclusionClasses = [
            "exclude-from-copy",
            "flag-nav",
            "info-icon",
            "icon",
            "button",
            "button-primary",
            "button-secondary",
          ];
          return !exclusionClasses.some((classname) =>
            node.classList?.contains(classname)
          );
        },
        imageType: "image/png",
        backgroundColor: "#FFF",
        ...(this.props.options ? this.props.options : {}),
      }
    );
  }
  render() {
    if (!allowCopyClipboardItem()) return null;
    const buttonTitle = this.props.buttonTitle
      ? this.props.buttonTitle
      : "Click to copy";
    return (
      <button
        ref={this.copyButtonRef}
        onClick={this.handleCopy}
        className={`copy button-default button-secondary rounded print-hidden exclude-from-copy ${
          this.state.copyInProgress ? "button--loading" : ""
        }`}
        title={buttonTitle}
        style={this.props.buttonStyle ? this.props.buttonStyle : null}
      >
        <span className="button__text">
          <FontAwesomeIcon icon={faCopy}></FontAwesomeIcon>
        </span>
      </button>
    );
  }
}

CopyButton.propTypes = {
  elementToCopy: PropTypes.object, // element to be copied
  buildElementForCopy: PropTypes.func, // function for building element(s) to be copied
  buttonTitle: PropTypes.string,
  buttonStyle: PropTypes.object,
  disableFrame: PropTypes.bool,
  beforeCopy: PropTypes.func, // function to execute before copy
  afterCopy: PropTypes.func, // function to execute after copy
  options: PropTypes.object, // copy options
};
