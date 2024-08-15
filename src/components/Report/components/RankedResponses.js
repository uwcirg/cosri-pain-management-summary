import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CopyButton from "../../CopyButton";
import {
  getDisplayDateFromISOString,
  isEmptyArray,
} from "../../../helpers/utility";
import PropTypes from "prop-types";

export default class RankedResponses extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      dates: [],
      selectedIndex: 0,
    };
    this.handleClickNextButton = this.handleClickNextButton.bind(this);
    this.handleClickPrevButton = this.handleClickPrevButton.bind(this);
    this.handleSetFirst = this.handleSetFirst.bind(this);
    this.handleSetLast = this.handleSetLast.bind(this);
    this.tableRef = React.createRef();
  }
  componentDidMount() {
    this.initData(this.props.summary);
  }
  initData(summary) {
    if (!summary) return;
    if (isEmptyArray(summary.ResponsesSummary)) return;
    // const testData = [
    //   {
    //     date: "4/28/2024",
    //     responses: [
    //       {
    //         question: "2nd",
    //         answer: "Help getting back to important activities",
    //       },
    //       {
    //         question: "3rd",
    //         answer: "Help in coping with the pain",
    //       },
    //       {
    //         question: "1st",
    //         answer: "A diagnosis (to help find the cause of pain)",
    //       },
    //     ],
    //   },
    //   {
    //     date: "1/12/2024",
    //     responses: [
    //       {
    //         question: "2nd",
    //         answer: "A cure",
    //       },
    //       {
    //         question: "3rd",
    //         answer: "Help in coping with the pain",
    //       },
    //       {
    //         question: "1st",
    //         answer: "A diagnosis (to help find the cause of pain)",
    //       },
    //     ],
    //   },
    //   {
    //     date: "4/12/2024",
    //     responses: [
    //       {
    //         question: "1st",
    //         answer: "Help in coping with the pain",
    //       },
    //       {
    //         question: "2nd",
    //         answer: "A cure",
    //       },
    //       {
    //         question: "3rd",
    //         answer: "A diagnosis (to help find the cause of pain)",
    //       },
    //     ],
    //   },
    //   {
    //     date: "3/24/2024",
    //     responses: [
    //       {
    //         question: "1st",
    //         answer: "A cure",
    //       },
    //       {
    //         question: "2nd",
    //         answer: "Help in coping with the pain",
    //       },
    //       {
    //         question: "3rd",
    //         answer: "A diagnosis (to help find the cause of pain)",
    //       },
    //     ],
    //   },
    // ];
    const sortedData = summary.ResponsesSummary.filter(
      (item) => !isEmptyArray(item.responses)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (isEmptyArray(sortedData)) return;
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
      fontSize: "0.85em",
      textAlign: "left",
      width: "100%",
    };
    return (
      <div className="flex flex-gap-1" style={{marginBottom: "16px"}}>
        <div style={titleContainerStyle} className="print-hidden">
          Responses (Last on {getDisplayDateFromISOString(this.state.dates[0])})
        </div>
        {this.renderCopyButton()}
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
      borderWidth: "1px",
      borderStyle: "solid",
      padding: "6px 20px",
      borderRadius: "100vmax",
      fontWeight: 600,
      cursor: "pointer",
      position: "relative",
      zIndex: 10,
      backgroundColor: "#FFF",
      backgroundImage: "none",
      borderColor: "#bfceda",
    };
    return (
      <div className="flex flex-gap-1 icons-container exclude-from-copy">
        <button
          title="First"
          style={buttonStyle}
          onClick={this.handleSetFirst}
          className={this.state.selectedIndex <= 0 ? "disabled" : ""}
        >
          <FontAwesomeIcon icon="angle-double-left"></FontAwesomeIcon>
        </button>
        <button
          style={buttonStyle}
          onClick={this.handleClickPrevButton}
          className={this.state.selectedIndex <= 0 ? "disabled" : ""}
          title="Less"
        >
          <FontAwesomeIcon icon="chevron-left"></FontAwesomeIcon>
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
          <FontAwesomeIcon icon="chevron-right"></FontAwesomeIcon>
        </button>
        {/* <button
          style={buttonStyle}
          onClick={this.handleSetFirst}
          className={this.state.selectedIndex <= 0 ? "disabled" : ""}
          title="Reset"
        >
          <FontAwesomeIcon icon="redo"></FontAwesomeIcon>
        </button> */}
        <button
          title="Last"
          style={buttonStyle}
          onClick={this.handleSetLast}
          className={
            this.state.selectedIndex >= this.state.dates.length - 1
              ? "disabled"
              : ""
          }
        >
          <FontAwesomeIcon icon="angle-double-right"></FontAwesomeIcon>
        </button>
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
          <th className="fixed-cell accent dark-border fat">Rank</th>
          {this.state.dates.map((date, index) => {
            return (
              <th
                style={{
                  backgroundColor: index > 0 ? "#f6f9fa" : "#FFF",
                  display:
                    index <= this.state.selectedIndex ? "table-cell" : "none",
                }}
                className={`${
                  index > 0 ? "exclude-from-copy print-hidden active" : ""
                }  accent dark-border fat`}
                key={`ranked_responses_header_${index}`}
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
        {this.renderTableRow("1st")}
        {this.renderTableRow("2nd")}
        {this.renderTableRow("3rd")}
      </tbody>
    );
  }
  renderTableRow(rank) {
    return (
      <tr>
        <td className="fixed-cell text-bold dark-border text-center">{rank}</td>
        {this.state.dates.map((date, index) => {
          return this.renderRankedCell(index, rank);
        })}
      </tr>
    );
  }
  renderRankedCell(index, rank) {
    return (
      <td
        key={`${index}_${rank}`}
        style={{
          backgroundColor: index > 0 ? "#f6f9fa" : "#FFF",
          display: index <= this.state.selectedIndex ? "table-cell" : "none",
        }}
        className={`${
          index > 0 ? "exclude-from-copy print-hidden" : ""
        } dark-border fat nowrap`}
      >
        {this.getRankedDataByIndex(index, rank)}
      </td>
    );
  }
  renderCopyButton() {
    return (
      <CopyButton
        buttonTitle="Click to copy the most recent responses"
        elementToCopy={this.tableRef.current}
      ></CopyButton>
    );
  }
  render() {
    //consts
    const tableStyle = {
      borderCollapse: "separate",
      borderSpacing: 0,
      border: 0,
      tableLayout: "fixed",
      width: "auto",
      margin: 0,
    };
    const containerStyle = {
      padding: "16px 24px",
      position: "relative",
      maxWidth: "1100px",
    };
    const dotsContainerStyle = {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };
    const navContainerStyle = {
      position: "relative",
      overflow: "auto",
    };
    if (isEmptyArray(this.state.dates)) {
      return <div className="no-entries">No recorded responses</div>;
    }
    return (
      <div
        className="flex flex-column flex-gap-2 flex-align-start"
        style={containerStyle}
      >
        <div
          style={navContainerStyle}
          className="responses-table-outer-wrapper slide-table-container"
        >
          <table className="table" style={tableStyle} ref={this.tableRef}>
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

RankedResponses.propTypes = {
  summary: PropTypes.object,
};
