import React, { Component } from "react";
import PropTypes from "prop-types";
import Score from "./Score";
import PassUpArrowIcon from "../../icons/PassUpArrowIcon";
import FailUpArrowIcon from "../../icons/FailUpArrowIcon";
import FailDownArrowIcon from "../../icons/FailDownArrowIcon";
import PassDownArrowIcon from "../../icons/PassDownArrowIcon";
import LineIcon from "../../icons/LineIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  allowCopyClipboardItem,
  isNumber,
  toDate,
  //writeHTMLToClipboard,
  copyDomToClipboard,
} from "../../helpers/utility";
const BORDER_COLOR = "#f3f6f9";
export default class ScoringSummary extends Component {
  constructor() {
    super(...arguments);
    this.tableRef = React.createRef();
    this.copyTable = this.copyTable.bind(this);
    this.tableStyle = {
      borderCollapse: "collapse",
      border: `1px solid ${BORDER_COLOR}`,
    };
    this.cellStyle = {
      borderRight: `1px solid ${BORDER_COLOR}`,
      borderLeft: `1px solid ${BORDER_COLOR}`,
      borderBottom: `1px solid ${BORDER_COLOR}`,
    };
    this.headerCellStyle = {
      borderRight: `1px solid ${BORDER_COLOR}`,
      borderLeft: `1px solid ${BORDER_COLOR}`,
      borderBottom: `2px solid ${BORDER_COLOR}`,
    };
    this.summaryHTML = "";
  }
  sortData(data) {
    if (!data || !Array.isArray(data) || !data.length) return null;
    return data.sort(
      (a, b) => toDate(b.date).getTime() - toDate(a.date).getTime()
    );
  }
  getDataByIndex(data, index) {
    const sortedData = this.sortData(data);
    if (!sortedData) return null;
    return sortedData[index];
  }
  getCurrentData(data) {
    return this.getDataByIndex(data, 0);
  }
  getPreviousScore(data) {
    const sortedData = this.getDataByIndex(data, 1);
    if (!sortedData) return null;
    const score = sortedData.score;
    if (!isNumber(score)) return null;
    return parseInt(score);
  }
  getCurrentScore(data) {
    const sortedData = this.getDataByIndex(data, 0);
    if (!sortedData) return null;
    const score = sortedData.score;
    if (!isNumber(score)) return null;
    return parseInt(score);
  }
  getDisplayIcon(data) {
    const currentData = this.getCurrentData(data.ResponsesSummary);
    const currentScore = this.getCurrentScore(data.ResponsesSummary);
    const prevScore = this.getPreviousScore(data.ResponsesSummary);
    //debug
    // console.log(
    //   "current score ",
    //   currentScore,
    //   "current score is number? ",
    //   isNumber(currentScore),
    //   "prev score ",
    //   prevScore,
    //   " prev score is number? ",
    //   isNumber(prevScore)
    // );
    const comparisonToAlert =
      currentData && currentData.comparisonToAlert
        ? currentData.comparisonToAlert
        : "";
    if (!comparisonToAlert) return "--";
    //debug
    //console.log("comparison to alert ", comparisonToAlert);
    if (!isNumber(currentScore) || !isNumber(prevScore)) return "--";
    if (isNumber(prevScore)) {
      if (comparisonToAlert === "lower") {
        if (currentScore < prevScore)
          return <FailDownArrowIcon></FailDownArrowIcon>;
        if (currentScore > prevScore)
          return <PassUpArrowIcon></PassUpArrowIcon>;
        return <LineIcon></LineIcon>;
      } else {
        if (currentScore > prevScore) {
          return <FailUpArrowIcon></FailUpArrowIcon>;
        }
        if (currentScore < prevScore)
          return <PassDownArrowIcon></PassDownArrowIcon>;
        return <LineIcon></LineIcon>;
      }
    } else {
      if (isNumber(currentScore)) return <LineIcon></LineIcon>;
      return "--";
    }
  }
  getRangeDisplay(data) {
    if (!data || !data.ScoreParams) return null;
    const minScore = data.ScoreParams.minScore;
    const maxScore = data.ScoreParams.maxScore;
    return (
      <sub className="text-muted sub">
        {"(" + minScore + "-" + maxScore + ")"}
      </sub>
    );
  }
  getNumAnswered(data) {
    if (!this.getCurrentData(data.ResponsesSummary)) return "--";
    const totalItems = data.ResponsesSummary[0].totalItems;
    const totalAnsweredItems = data.ResponsesSummary[0].totalAnsweredItems;
    if (!totalItems || !totalAnsweredItems) return "--";
    return `${totalAnsweredItems} / ${totalItems}`;
  }
  getScoreMeaning(data) {
    if (!this.getCurrentData(data.ResponsesSummary)) return "--";
    return data.ResponsesSummary[0].scoreMeaning || "--";
  }
  getCurrentDisplayScore(data) {
    if (!this.getCurrentData(data.ResponsesSummary)) return "--";
    return this.getCurrentScore(data.ResponsesSummary);
  }
  getTitleDisplay() {
    return this.props.title ? this.props.title : "Scoring Summary";
  }
  handleGoToSection(event, id) {
    event.preventDefault();
    const targetElement = document.querySelector(id);
    if (!targetElement) return;
    const listElements = document.querySelectorAll(".toc-link");
    targetElement.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
    setTimeout(
      () => listElements.forEach((e) => e.classList.remove("is-active-link")),
      800
    );
  }
  renderTableHeaders() {
    return (
      <thead>
        <tr>
          <th className="empty" style={this.headerCellStyle}></th>
          <th style={this.headerCellStyle}>Score</th>
          <th style={this.headerCellStyle}># Answered</th>
          <th className="text-center" style={this.headerCellStyle}>
            Meaning
          </th>
          <th style={this.headerCellStyle}>Compare to Last</th>
        </tr>
      </thead>
    );
  }
  renderNoDataRow() {
    return (
      <tr className="no-data-row">
        <td colSpan="3" className="text-left">
          <div className="no-entries">No data available</div>
        </td>
      </tr>
    );
  }
  renderQuestionnaireLinkCell(questionnaireObj, showAnchorLinks) {
    if (!questionnaireObj) return <td>--</td>;
    const questionnaireShortName = questionnaireObj.QuestionnaireShortName
      ? questionnaireObj.QuestionnaireShortName
      : "";
    const questionnaireName = questionnaireObj.QuestionnaireName
      ? questionnaireObj.QuestionnaireName
      : questionnaireObj.QuestionnaireID;
    if (!questionnaireName) return <td>--</td>;
    const anchorId = `#${questionnaireName}_anchor`;
    const displayText = questionnaireShortName
      ? questionnaireShortName
      : questionnaireName;
    return (
      <td className="text-left" style={this.cellStyle}>
        {showAnchorLinks && (
          <span>
            <b>
              <a
                className="anchor"
                href={`${anchorId}`}
                onClick={(e) => this.handleGoToSection(e, anchorId)}
                title={`Go to see more for ${questionnaireName.toUpperCase()}`}
              >
                {displayText.toUpperCase()}
              </a>
            </b>
          </span>
        )}
        {!showAnchorLinks && <span>{displayText.toUpperCase()}</span>}
      </td>
    );
  }
  renderScoreCell(data) {
    if (!data || !data.ResponsesSummary) return <td>--</td>;
    return (
      <td className="nowrap" style={this.cellStyle}>
        <div className="flex">
          <Score
            score={this.getCurrentDisplayScore(data)}
            scoreParams={this.getCurrentData(data.ResponsesSummary)}
            cssClass="flex-1"
          ></Score>
          <div className="flex-1 text-right">{this.getRangeDisplay(data)}</div>
        </div>
      </td>
    );
  }
  renderDataRows(summary, showAnchorLinks) {
    const dataToShow = summary.filter((item) => !item.ExcludeFromScoring);
    return dataToShow.map((item, index) => {
      return (
        <tr key={`questionnaire_summary_row_${index}`} className="data-row">
          {this.renderQuestionnaireLinkCell(item, showAnchorLinks)}
          {this.renderScoreCell(item)}
          <td valign="middle" style={this.cellStyle}>
            {this.getNumAnswered(item)}
          </td>
          <td
            className="text-capitalize"
            valign="middle"
            style={this.cellStyle}
          >
            {this.getScoreMeaning(item)}
          </td>
          <td valign="middle" style={this.cellStyle}>
            <div className="icon-container">{this.getDisplayIcon(item)}</div>
          </td>
        </tr>
      );
    });
  }
  copyTable() {
    if (!allowCopyClipboardItem()) return null;
    // writeHTMLToClipboard(
    //   "<div style='font-family: Arial, sans-serif'>" +
    //     this.tableRef.current.outerHTML +
    //     "</div>"
    // )
    //   .then(() => {
    //     alert("All content copied to clipboard");
    //   })
    //   .catch((e) => {
    //     alert("Error copying content to clipboard " + e);
    //   });
    copyDomToClipboard(this.tableRef.current);
  }
  renderCopyButton() {
    if (!allowCopyClipboardItem()) return null;
    return (
      <button
        onClick={this.copyTable}
        className="button-default rounded"
        style={{
          color: "#777",
          minWidth: "56px",
          textAlign: "center",
        }}
        title="Copy scoring summary table as an image"
      >
        <FontAwesomeIcon icon="copy"></FontAwesomeIcon>
      </button>
    );
  }
  render() {
    const { summary, showAnchorLinks } = this.props;
    const noSummaryData =
      !summary ||
      !summary.length ||
      summary.filter(
        (item) => item.ResponsesSummary && item.ResponsesSummary.length > 0
      ).length === 0;
    return (
      <React.Fragment>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            className="panel-title"
            style={{
              marginTop: 0,
              marginBottom: "8px",
            }}
          >
            {this.getTitleDisplay()}
          </h3>
          {/* JUST to test copy */}
          <div style={{ marginBottom: "16px", textAlign: "right" }}>
            {this.renderCopyButton()}
          </div>
        </div>
        <table
          className="table score-summary-table"
          ref={this.tableRef}
          style={this.tableStyle}
        >
          {!noSummaryData && this.renderTableHeaders()}
          <tbody>
            {noSummaryData && this.renderNoDataRow()}
            {!noSummaryData && this.renderDataRows(summary, showAnchorLinks)}
          </tbody>
        </table>
      </React.Fragment>
    );
  }
}

ScoringSummary.propTypes = {
  title: PropTypes.string,
  summary: PropTypes.array,
  showAnchorLinks: PropTypes.bool,
};
