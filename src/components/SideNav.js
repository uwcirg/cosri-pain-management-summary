import React, { Component } from "react";
import PropTypes from "prop-types";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

export default class SideNav extends Component {
  constructor() {
    super(...arguments);
    this.state = { showNav: true };
    this.navRef = React.createRef();

    // This binding is necessary to make `this` work in the callback
    this.handleNavToggle = this.handleNavToggle.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  handleNavToggle(e) {
    e.preventDefault();
    this.setState((state) => ({
      showNav: !state.showNav,
    }));
  }

  handleResize() {
    this.setState({
      showNav: window.innerWidth < 1200 ? false : true,
    });
  }

  componentDidMount() {
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  }

  render() {
    const navToggleToolTip = this.state.showNav
      ? "collapse side navigation menu"
      : "expand side navigation menu";
    const navId = this.props.id ? this.props.id : "sideNavButton";
    return (
      <div
        className={`${this.state.showNav ? "open" : ""} summary__nav-wrapper`}
      >
        <nav className="summary__nav"></nav>
        <div
          role="button"
          ref={(ref) => (this.navRef = ref)}
          data-for={navId}
          data-tip={navToggleToolTip}
          data-place="right"
          className={`${this.props.navClassName} summary__nav-button close`}
          title="toggle side navigation menu"
          onClick={(e) => {
            Tooltip.hide(this.navRef);
            this.handleNavToggle(e);
            if (this.props.onClick) this.props.onClick();
          }}
          onKeyUp={(e) => {
            this.handleNavToggle(e);
          }}
          tabIndex={0}
        ></div>
        <Tooltip anchorId={navId}  className="summary-tooltip" place="right" style={{ zIndex: 9999 }}>
            <div>{navToggleToolTip}</div>
          </Tooltip>
        {/* <ReactTooltip className="summary-tooltip" id={navId} /> */}
      </div>
    );
  }
}

SideNav.propTypes = {
  id: PropTypes.string,
  navClassName: PropTypes.string,
  onClick: PropTypes.func,
};
