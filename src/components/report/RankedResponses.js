import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
//import PropTypes from "prop-types";

export default class RankedResponses extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      dates: ["4/1/2004", "3/1/2004", "2/1/2004"],
      data: [],
      selectedIndex: 0,
    };
    this.handleClickNextButton = this.handleClickNextButton.bind(this);
    this.handleClickPrevButton = this.handleClickPrevButton.bind(this);
    this.handleSetFirst = this.handleSetFirst.bind(this);
    this.handleSetLast = this.handleSetLast.bind(this);

    //consts
    const BORDER_COLOR = "#777";
    const HEADER_BORDER_COLOR = "#217684";
    this.tableStyle = {
      borderCollapse: "collapse",
      border: `1px solid ${BORDER_COLOR}`,
    };
    this.cellStyle = {
      borderRight: `1px solid ${BORDER_COLOR}`,
      borderLeft: `1px solid ${BORDER_COLOR}`,
      borderBottom: `1px solid ${BORDER_COLOR}`,
      padding: "12px 16px",
    };
    this.headerCellStyle = {
      borderTop: `1px solid ${BORDER_COLOR}`,
      borderRight: `1px solid ${BORDER_COLOR}`,
      borderLeft: `1px solid ${BORDER_COLOR}`,
      borderBottom: `2px solid ${HEADER_BORDER_COLOR}`,
      padding: "8px 16px",
    };
  }
  handleSetFirst() {
    if (this.state.selectedIndex === 0) return;
    this.setState({
      selectedIndex: 0,
      selectedDate: this.state.dates[0],
    });
  }
  handleSetLast() {
    const lastIndex = this.state.dates.length - 1;
    if (this.state.selectedIndex === lastIndex) return;
    this.setState({
      selectedIndex: lastIndex,
      selectedDate: this.state.dates[lastIndex],
    });
  }
  handleClickPrevButton() {
    const prevIndex = this.state.selectedIndex - 1;
    // console.log("Prev Index ", prevIndex);
    if (prevIndex < 0) return;
    this.setState({
      selectedIndex: prevIndex,
      selectedDate: this.state.dates[prevIndex],
    });
  }
  handleClickNextButton() {
    const nextIndex = this.state.selectedIndex + 1;
    if (nextIndex > this.state.dates.length - 1) return;
    this.setState({
      selectedIndex: nextIndex,
      selectedDate: this.state.dates[nextIndex],
    });
  }
  renderNavTitle() {
    const titleContainerStyle = {
      color: "#777",
      fontSize: "0.85em",
      textAlign: "left",
      width: "100%",
      marginBottom: "8px",
    };
    return <div style={titleContainerStyle}>Responses</div>;
  }
  renderNavButtons() {
    // const iconStyle = {
    //   borderWidth: "1px",
    //   borderStyle: "solid",
    //   padding: "8px",
    //   width: "22px",
    //   height: "22px",
    //   borderRadius: "100vmax",
    //   cursor: "pointer",
    //   position: "relative",
    //   zIndex: 10,
    // };
    const buttonStyle = {
      borderWidth: "2px",
      borderStyle: "solid",
      padding: "8px 16px",
      borderRadius: "100vmax",
      fontWeight: 600,
      cursor: "pointer",
      position: "relative",
      zIndex: 10,
      backgroundColor: "#FFF",
      backgroundImage: "none",
    };
    if (
      !this.state.dates ||
      !this.state.dates.length ||
      this.state.dates.length < 2
    )
      return null;
    return (
      <div className="flex flex-gap-1 icons-container exclude-from-copy">
        {/* <FontAwesomeIcon
          icon="angle-double-left"
          title="First"
          style={iconStyle}
          onClick={this.handleSetFirst}
          className={this.state.selectedIndex <= 0 ? "disabled" : ""}
        ></FontAwesomeIcon> */}
        <button
          style={buttonStyle}
          onClick={this.handleClickPrevButton}
          className={this.state.selectedIndex <= 0 ? "disabled" : ""}
        >
          <FontAwesomeIcon
            icon="chevron-left"
            title="Less"
            style={{ marginRight: "4px" }}
          ></FontAwesomeIcon>
          Less
        </button>
        <button
          style={buttonStyle}
          onClick={this.handleClickNextButton}
          className={
            this.state.selectedIndex >= this.state.dates.length - 1
              ? "disabled"
              : ""
          }
        >
          More
          <FontAwesomeIcon
            icon="chevron-right"
            title="Next"
            style={{ marginLeft: "4px" }}
          ></FontAwesomeIcon>
        </button>
        {/* <FontAwesomeIcon
          icon="angle-double-right"
          title="Last"
          style={iconStyle}
          onClick={this.handleSetLast}
          className={
            this.state.selectedIndex >= this.state.dates.length - 1
              ? "disabled"
              : ""
          }
        ></FontAwesomeIcon> */}
      </div>
    );
  }
  renderDots() {
    if (!this.state.dates) return null;
    if (this.state.dates.length < 2) return null;
    return (
      <div className="exclude-from-copy dots-container print-hidden">
        {this.state.dates.map((item, index) => {
          return (
            <div
              className={`dot ${
                index === this.state.selectedIndex ? "active" : ""
              }`}
              key={`dot_${index}`}
              title={`${item}`}
            ></div>
          );
        })}
      </div>
    );
  }
  renderTableHeader() {
    return (
      <thead>
        <th style={this.headerCellStyle}>Rank</th>
        {this.state.dates.map((date, index) => {
          return (
            <th
              style={{
                ...this.headerCellStyle,
                ...{
                  display:
                    index <= this.state.selectedIndex ? "table-cell" : "none",
                },
              }}
              className={`${index > 0 ? "exclude-from-copy print-hidden" : ""}`}
            >
              Goals {date}
            </th>
          );
        })}
      </thead>
    );
  }
  renderTableBody() {
    return (
      <tbody>
        <tr>
          <td style={this.cellStyle}>1st</td>
          {this.state.dates.map((date, index) => {
            return (
              <td
                style={{
                  ...this.cellStyle,
                  ...{
                    display:
                      index <= this.state.selectedIndex ? "table-cell" : "none",
                  },
                }}
                className={`${
                  index > 0 ? "exclude-from-copy print-hidden" : ""
                }`}
              >
                {/* TODO: display ranked response */}
                Test
              </td>
            );
          })}
        </tr>
        <tr>
          <td style={this.cellStyle}>2nd</td>
          {this.state.dates.map((date, index) => {
            return (
              <td
                style={{
                  ...this.cellStyle,
                  ...{
                    display:
                      index <= this.state.selectedIndex ? "table-cell" : "none",
                  },
                }}
                className={`${
                  index > 0 ? "exclude-from-copy print-hidden" : ""
                }`}
              >
                {/* TODO: display ranked response */}
                Test
              </td>
            );
          })}
        </tr>
        <tr>
          <td style={this.cellStyle}>3rd</td>
          {this.state.dates.map((date, index) => {
            return (
              <td
                style={{
                  ...this.cellStyle,
                  ...{
                    display:
                      index <= this.state.selectedIndex ? "table-cell" : "none",
                  },
                }}
                className={`${
                  index > 0 ? "exclude-from-copy print-hidden" : ""
                }`}
              >
                {/* TODO: display ranked response */}
                Test
              </td>
            );
          })}
        </tr>
      </tbody>
    );
  }
  render() {
    return (
      <div
        class="flex flex-column flex-gap-2 flex-align-start"
        style={{ padding: "16px 24px" }}
      >
        <table style={this.tableStyle}>
          {this.renderTableHeader()}
          {this.renderTableBody()}
        </table>
        <div className="flex flex-column">
          {this.renderNavTitle()}
          {this.renderNavButtons()}
          <div>{this.renderDots()}</div>
        </div>
      </div>
    );
  }
}
