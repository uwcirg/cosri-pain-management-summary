import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { imageOK } from "../helpers/utility";

export default class Header extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      patientSearchURL: "",
    };
  }
  componentDidMount() {
    this.setState({
      patientSearchURL: this.props["patientSearchURL"],
    });
  }
  handleSearchClick(e) {
    //clear current frontend session
    sessionStorage.clear();
    let url = e.target.getAttribute("data-url");
    setTimeout(() => {
      window.location = url;
    }, 0);
  }
  handleImageLoaded(e) {
    if (!e.target) {
      return false;
    }
    let imageLoaded = imageOK(e.target);
    if (!imageLoaded) {
      e.target.setAttribute("disabled", true);
      return;
    }
    let defaultLogoImage = document.querySelector(".default-logo");
    if (defaultLogoImage) {
      defaultLogoImage.setAttribute("disabled", true);
    }
  }
  handleImageLoadError(e) {
    if (!e.target) {
      return false;
    }
    let imageLoaded = imageOK(e.target);
    if (!imageLoaded) {
      e.target.setAttribute("disabled", true);
      return;
    }
  }
  render() {
    const { patientName, patientDOB, patientGender, patientSearchURL, siteID } =
      this.props;

    return (
      <header className="header">
        <div className="header__logo">
          <img
            className="header__logo-img primary"
            src={process.env.PUBLIC_URL + "/assets/images/logo_horizontal.png"}
            alt="cds connect logo"
          />
        </div>
        <div className="header__summary">
          <div className="header__summary-patient">
            {(patientName || patientDOB) && (
              <div className="patient-info">
                <div className="flex" style={{ alignItems: "flex-start" }}>
                  {patientName && (
                    <FontAwesomeIcon
                      className="patient-icon"
                      icon="user-circle"
                      title="patient"
                    />
                  )}
                  <div>
                    <h1 className="patient-name">
                      {patientName ?? "Name not available"}
                    </h1>
                    <div className="patient-demographics">
                      {patientDOB && (
                        <span
                          className="patient-dob"
                          aria-label="Date of birth"
                        >
                          DOB: {patientDOB}
                        </span>
                      )}
                      <span className="patient-gender">{patientGender}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="header__search">
              <button
                className={`button-primary ${
                  !this.state.patientSearchURL ? "disabled" : ""
                }`}
                onClick={this.handleSearchClick}
                data-url={patientSearchURL}
                disabled={this.state.patientSearchURL ? false : true}
              >
                New Patient Search
              </button>
            </div>
          </div>
          <div className="header__summary-dashboard">
            {siteID && (
              <div className="header__site-logo">
                <img
                  src={
                    process.env.PUBLIC_URL +
                    "/assets/" +
                    siteID +
                    "/images/logo.png"
                  }
                  siteid={siteID}
                  alt="site logo"
                  onLoad={this.handleImageLoaded}
                  onError={this.handleImageLoadError}
                />
              </div>
            )}
            <div className="entries">
              <img
                src={process.env.PUBLIC_URL + "/assets/images/doh_logo.png"}
                alt="doh logo"
                className="default-logo"
              />
            </div>
          </div>
        </div>
      </header>
    );
  }
}

Header.propTypes = {
  patientName: PropTypes.string.isRequired,
  patientDOB: PropTypes.string.isRequired,
  patientGender: PropTypes.string,
  patientSearchURL: PropTypes.string,
  siteID: PropTypes.string,
};
