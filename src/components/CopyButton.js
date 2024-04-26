import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
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
    console.log("pros options ", this.props.options)
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
              if (!error)
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
        ...this.props.options?this.props.options:{}
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
        className={`button-default button-secondary rounded print-hidden exclude-from-copy ${
          this.state.copyInProgress ? "button--loading" : ""
        }`}
        title={buttonTitle}
        style={this.props.buttonStyle ? this.props.buttonStyle : null}
      >
        <span className="button__text">
          <FontAwesomeIcon icon="copy"></FontAwesomeIcon>
        </span>
      </button>
    );
  }
}
