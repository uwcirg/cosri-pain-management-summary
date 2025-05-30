import React, { Component } from "react";

export default class Disclaimer extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      displayed: false,
    };
    this.handleCloseToggle = this.handleCloseToggle.bind(this);
  }

  handleClose = () => {
    this.setState({ displayed: false });
  };

  handleCloseToggle(e) {
    e.preventDefault();
    this.setState((state) => ({
      displayed: !state.displayed,
    }));
  }

  render() {
    const conditionalClass = this.state.displayed ? "" : "close";
    return (
      <div className="disclaimers-container">
        <div className="cdc-disclaimer">
          Please see the
          <a
            href="https://www.cdc.gov/mmwr/volumes/65/rr/rr6501e1.htm"
            alt="CDC Guideline for Prescribing Opioids for Chronic Pain"
            target="_blank"
            rel="noopener noreferrer"
          >
            CDC Guideline for Prescribing Opioids for Chronic Pain
          </a>
          for additional information and prescribing guidance.
        </div>
        <div
          className={`cdc-disclaimer data-source ${conditionalClass}`}
          onClick={this.handleCloseToggle}
          onKeyUp={this.handleCloseToggle}
          role="button"
          tabIndex={0}
        >
          <h3 className="title no-margins js-toc-ignore">
            COSRI development and open source software details
          </h3>
          <button className="close-button button-link" title="toggle show/hide">
            [show/hide]
          </button>
          <div className="content">
            <div className="content">
              COSRI incorporates the Clinical Pain Management Summary
              application, released as open-source software by CDS Connect
              project at the Agency for Healthcare Research and Quality (AHRQ).
              We have extended ARHQ's work to provide enhanced security,
              improved decision support, integration with state Prescription
              Drug Monitoring Program databases, standalone operation, and other
              features. For a description of our open source release, contact{" "}
              <a href="mailto:info@cosri.app">info@cosri.app</a>. Support for
              the development of COSRI was provided by the Washington State
              Department of Health and the Washington State Health Care
              Authority through the CMS Support Act. Additional COSRI
              implementation and evaluation funding provided by the Centers for
              Disease Control and Prevention (CDC) and the Assistant Secretary
              for Technology Policy (ASTP) through contract #
              GS-35F-0034W/75P00122F80168, awarded to Security Risk Solutions,
              Inc.
            </div>
          </div>
        </div>
      </div>
    );
  }
}
