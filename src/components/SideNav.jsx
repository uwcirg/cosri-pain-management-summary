import React, { Component } from "react";
import PropTypes from "prop-types";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { isElementOverflown } from "../helpers/utility";

export default class SideNav extends Component {
  constructor() {
    super(...arguments);
    this.state = { showNav: true };
    this.navRef = React.createRef();

    // This binding is necessary to make `this` work in the callback
    this.handleNavToggle = this.handleNavToggle.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  handleRootClass() {
    if (this.state.showNav)
      document.querySelector("#root").classList.remove("collapsed");
    else document.querySelector("#root").classList.add("collapsed");
  }

  handleNavToggle(e) {
    e.preventDefault();
    this.setState(
      {
        showNav: !this.state.showNav,
      },
      () => {
        this.handleRootClass();
      }
    );
  }

  handleResize() {
    const isSmallerScreen = window.innerWidth && window.innerWidth <= 1360;
    const { parentContainerElement } = this.props;
    this.setState(
      {
        showNav: isSmallerScreen
          ? false
          : parentContainerElement
          ? !isElementOverflown(parentContainerElement, "width")
          : true,
      },
      () => {
        this.handleRootClass();
      }
    );
  }

  componentDidMount() {
    window.addEventListener("resize", this.handleResize);
    setTimeout(() => this.handleResize(), 250);
  }

  render() {
    const navToggleToolTip = this.state.showNav
      ? "collapse side navigation menu"
      : "expand side navigation menu";
    const navId = this.props.id ? this.props.id : "sideNavButton";
    return (
      <>
        <div
          className={`${this.state.showNav ? "open" : ""} summary__nav-wrapper`}
        >
          <nav className="summary__nav"></nav>
          {this.props.children}
          <div
            role="button"
            ref={(ref) => (this.navRef = ref)}
            data-for={navId}
            data-tip={navToggleToolTip}
            data-place="right"
            className={`${this.props.navClassName} summary__nav-button close`}
            title="toggle side navigation menu"
            onClick={(e) => {
              this.handleNavToggle(e);
              if (this.props.onClick) this.props.onClick();
            }}
            onKeyUp={(e) => {
              this.handleNavToggle(e);
            }}
            tabIndex={0}
            data-tooltip-id={`${navId}_tooltip`}
            data-tooltip-content={navToggleToolTip}
            //data-tooltip-hidden={!this.state.showNav}
          ></div>
          {/* <Tooltip
            id={navId}
            className="summary-tooltip"
            place="right"
            style={{ zIndex: 9999 }}
          >
            <div>{navToggleToolTip}</div>
          </Tooltip> */}
          <Tooltip
            id={`${navId}_tooltip`}
            place="right"
            style={{ zIndex: 9999 }}
          >
          </Tooltip>
        </div>
        
      </>
    );
  }
}

SideNav.propTypes = {
  id: PropTypes.string,
  navClassName: PropTypes.string,
  onClick: PropTypes.func,
  parentContainerElement: PropTypes.object,
};
