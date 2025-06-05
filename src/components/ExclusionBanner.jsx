import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ChevronDownIcon from "../icons/ChevronDownIcon";
import {
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";

export default class ExclusionBanner extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      displayed: false,
    };
    this.handleCloseToggle = this.handleCloseToggle.bind(this);
  }

  handleClose = (e) => {
    e.stopPropagation();
    this.setState({ displayed: false });
  };

  handleCloseToggle(e) {
    if (e) e.preventDefault();
    this.setState((state) => ({
      displayed: !state.displayed,
    }));
  }

  render() {
    const conditionalClass = this.state.displayed ? "" : "close";
    return (
      <div
        className={`exclusion-banner banner ${conditionalClass}`}
        role="presentation"
        onClick={this.handleCloseToggle}
        onKeyDown={this.handleCloseToggle}
      >
        <ChevronDownIcon
          className="close-button"
          icon="times"
          title="close"
          width="25"
          height="25"
        />

        <div className="exclusion-banner__description">
          <strong className="title">
            <FontAwesomeIcon icon={faExclamationCircle} title="notice" />{" "}
            LIMITATIONS
          </strong>{" "}
          Guidance for adult pain except...{" "}
          <span className="info-icon" role="button">
            Click here
          </span>
          .
          <div className="content">
            <p>
              CDC's 2022 Clinical Practice Guideline <strong>applies</strong> to
              outpatients aged 18 years and older with:
            </p>
            <ul>
              <li>Acute pain (duration less than 1 month)</li>
              <li>Subacute pain (duration of 1-3 months)</li>
              <li>Chronic pain (duration of 3 months or more)</li>
            </ul>
            <p>
              It does <strong>not</strong> apply to management of patients
            </p>
            <ul>
              <li>with Sickle cell disease</li>
              <li>with Cancer-related pain</li>
              <li>receiving Palliative care</li>
              <li>receiving End-of-life care</li>
            </ul>
            <div className="text-right">
              <button className="plain info-icon" onClick={this.handleClose}>
                Click to hide info
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
