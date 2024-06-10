import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getDisplayDateFromISOString } from "../../../helpers/utility";
//import PropTypes from "prop-types";

const testData = [
  {
    date: "4/28/2024",
    responses: [
      {
        question: "2nd",
        answer: "Help getting back to important activities",
      },
      {
        question: "3rd",
        answer: "Help in coping with the pain",
      },
      {
        question: "1st",
        answer: "A diagnosis (to help find the cause of pain)",
      },
    ],
  },
  {
    date: "1/12/2024",
    responses: [
      {
        question: "2nd",
        answer: "A cure",
      },
      {
        question: "3rd",
        answer: "Help in coping with the pain",
      },
      {
        question: "1st",
        answer: "A diagnosis (to help find the cause of pain)",
      },
    ],
  },
  {
    date: "4/12/2024",
    responses: [
      {
        question: "1st",
        answer: "Help in coping with the pain",
      },
      {
        question: "2nd",
        answer: "A cure",
      },
      {
        question: "3rd",
        answer: "A diagnosis (to help find the cause of pain)",
      },
    ],
  },
  {
    date: "3/24/2024",
    responses: [
      {
        question: "1st",
        answer: "A cure",
      },
      {
        question: "2nd",
        answer: "Help in coping with the pain",
      },
      {
        question: "3rd",
        answer: "A diagnosis (to help find the cause of pain)",
      },
    ],
  },
];
export default class RankedResponses extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      dates: [],
      //data: [],
      data: testData,
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
      borderCollapse: "separate",
      borderSpacing: 0,
      border: 0,
      tableLayout: "fixed",
      width: "auto",
      margin: 0,
    };
    this.cellStyle = {
      borderRight: `1px solid ${BORDER_COLOR}`,
      borderLeft: `1px solid ${BORDER_COLOR}`,
      borderBottom: `1px solid ${BORDER_COLOR}`,
      padding: "8px 12px",
      backgroundColor: "#FFF",
      whiteSpace: "nowrap",
    };
    this.titleCellStyle = {
      ...this.cellStyle,
      fontWeight: 600,
    };
    this.headerCellStyle = {
      borderTop: `1px solid ${BORDER_COLOR}`,
      borderRight: `1px solid ${BORDER_COLOR}`,
      borderLeft: `1px solid ${BORDER_COLOR}`,
      borderBottom: `2px solid ${HEADER_BORDER_COLOR}`,
      padding: "8px 16px",
      backgroundColor: "#FFF",
    };
  }
  componentDidMount() {
    this.initData(this.props.data);
  }
  initData(data) {
    //TODO use passed in data
    const sortedData = this.state.data.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    this.setState({
      dates: sortedData.map((item) => item.date),
      data: sortedData,
    });
  }
  getRankedDataByIndex(index, rank) {
    const matchedData = this.state.data[index];
    if (!matchedData) return null;
    const matchedItem = matchedData.responses.find(
      (item) => item.question === rank
    );
    return matchedItem ? matchedItem.answer : "--";
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
  shouldRenderNav() {
    return (
      this.state.dates && this.state.dates.length && this.state.dates.length > 1
    );
  }
  renderNavTitle() {
    if (!this.shouldRenderNav()) return null;
    const titleContainerStyle = {
      //color: "#777",
      fontSize: "0.85em",
      textAlign: "left",
      width: "100%",
      marginBottom: "12px",
    };
    return (
      <div style={titleContainerStyle} className="print-hidden">
        Responses (Last on {getDisplayDateFromISOString(this.state.dates[0])})
      </div>
    );
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
    if (!this.shouldRenderNav()) return null;
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
          title="Less"
        >
          <FontAwesomeIcon icon="minus"></FontAwesomeIcon>
        </button>
        <button
          style={buttonStyle}
          onClick={this.handleClickNextButton}
          className={
            this.state.selectedIndex >= this.state.dates.length - 1
              ? "disabled"
              : ""
          }
          title="More"
        >
          <FontAwesomeIcon icon="plus"></FontAwesomeIcon>
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
    if (!this.shouldRenderNav()) return null;
    return (
      <div className="exclude-from-copy dots-container print-hidden">
        {this.state.dates.map((item, index) => {
          return (
            <div
              className={`dot ${
                index <= this.state.selectedIndex ? "active" : ""
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
        <tr>
          <th style={this.headerCellStyle} className="fixed-cell">
            Rank
          </th>
          {this.state.dates.map((date, index) => {
            return (
              <th
                style={{
                  ...this.headerCellStyle,
                  ...{
                    backgroundColor: index > 0 ? "#f6f9fa" : "#FFF",
                  },
                  ...{
                    display:
                      index <= this.state.selectedIndex ? "table-cell" : "none",
                  },
                }}
                className={`${
                  index > 0 ? "exclude-from-copy print-hidden" : ""
                }`}
              >
                Goals{" "}
                <span className="small">
                  ({getDisplayDateFromISOString(date)})
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
    );
  }
  renderTableBody() {
    return (
      <tbody>
        <tr>
          <td style={this.titleCellStyle} className="fixed-cell">
            1st
          </td>
          {this.state.dates.map((date, index) => {
            return this.renderRankedCell(index, "1st");
          })}
        </tr>
        <tr>
          <td style={this.titleCellStyle} className="fixed-cell">
            2nd
          </td>
          {this.state.dates.map((date, index) => {
            return this.renderRankedCell(index, "2nd");
          })}
        </tr>
        <tr>
          <td style={this.titleCellStyle} className="fixed-cell">
            3rd
          </td>
          {this.state.dates.map((date, index) => {
            return this.renderRankedCell(index, "3rd");
          })}
        </tr>
      </tbody>
    );
  }
  renderRankedCell(index, rank) {
    return (
      <td
        key={`${index}_${rank}`}
        style={{
          ...this.cellStyle,
          ...{
            backgroundColor: index > 0 ? "#f6f9fa" : "#FFF",
          },
          ...{
            display: index <= this.state.selectedIndex ? "table-cell" : "none",
          },
        }}
        className={`${index > 0 ? "exclude-from-copy print-hidden" : ""}`}
      >
        {this.getRankedDataByIndex(index, rank)}
      </td>
    );
  }
  render() {
    const containerStyle = { padding: "16px 24px", position: "relative" };
    const dotsContainerStyle = {
      minWidth: "120px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };
    const navContainerStyle = {
      position: "relative",
      overflow: "auto",
    };
    return (
      <div
        className="flex flex-column flex-gap-2 flex-align-start"
        style={containerStyle}
      >
        <div
          style={navContainerStyle}
          className="responses-table-outer-wrapper slide-table-container"
        >
          <table className="table" style={this.tableStyle}>
            {this.renderTableHeader()}
            {this.renderTableBody()}
          </table>
        </div>
        <div
          className="flex flex-column"
          style={{ justifyContent: "flex-start", alignItems: "flex-start" }}
        >
          {this.renderNavTitle()}
          {this.renderNavButtons()}
          <div style={dotsContainerStyle}>{this.renderDots()}</div>
        </div>
      </div>
    );
  }
}
