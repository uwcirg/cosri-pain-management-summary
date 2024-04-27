import React, { Component } from "react";
import PropTypes from "prop-types";
import Score from "./Score";
import PassUpArrowIcon from "../../icons/PassUpArrowIcon";
import FailUpArrowIcon from "../../icons/FailUpArrowIcon";
import FailDownArrowIcon from "../../icons/FailDownArrowIcon";
import PassDownArrowIcon from "../../icons/PassDownArrowIcon";
import LineIcon from "../../icons/LineIcon";
import CopyButton from "../CopyButton";
import {
  getDisplayDateFromISOString,
  isNumber,
  toDate,
} from "../../helpers/utility";
const BORDER_COLOR = "#f3f6f9";
export default class ScoringSummary extends Component {
  constructor() {
    super(...arguments);

    //refs
    this.tableRef = React.createRef();

    //constants
    this.captionRowStyle = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#FFF"
    };
    this.tableStyle = {
      border: `1px solid ${BORDER_COLOR}`,
    };
    this.cellStyle = {
      borderRight: `1px solid ${BORDER_COLOR}`,
      borderLeft: `1px solid ${BORDER_COLOR}`,
      borderBottom: `1px solid ${BORDER_COLOR}`,
    };
    this.headerCellStyle = {
      ...this.cellStyle,
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
  getCurrentDisplayDate(data) {
    const sortedData = this.getDataByIndex(data, 0);
    if (!sortedData) return "--";
    return getDisplayDateFromISOString(sortedData.date, {
      year: "numeric",
      month: "short",
    });
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

    const currentScore = this.getCurrentScore(data.ResponsesSummary);
    const prevScore = this.getPreviousScore(data.ResponsesSummary);
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
      return "--";
    }
  }
  getRangeDisplay(data) {
    if (!data || !data.ScoreParams) return null;
    const minScore = data.ScoreParams.minScore;
    const maxScore = data.ScoreParams.maxScore;
    if (isNumber(minScore) && isNumber(maxScore)) {
      return (
        <sub className="text-muted sub">
          {"(" + minScore + "-" + maxScore + ")"}
        </sub>
      );
    }
    return null;
  }
  getNumAnswered(data) {
    if (!this.getCurrentData(data.ResponsesSummary)) return "--";
    const totalItems = data.ResponsesSummary[0].totalItems;
    const totalAnsweredItems = data.ResponsesSummary[0].totalAnsweredItems;
    if (!isNumber(totalItems) || !isNumber(totalAnsweredItems)) return "--";
    return `${totalAnsweredItems} / ${totalItems}`;
  }
  getScoreMeaning(data) {
    if (!this.getCurrentData(data.ResponsesSummary)) return "--";
    return data.ResponsesSummary[0].scoreMeaning || "--";
  }
  getCurrentDisplayScore(data) {
    if (!this.getCurrentData(data.ResponsesSummary)) return "--";
    const currentScore = this.getCurrentScore(data.ResponsesSummary);
    if (currentScore == null) return "--";
    return currentScore;
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
          <th style={this.headerCellStyle}>Date</th>
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
  renderDateCell(data) {
    if (!data || !data.ResponsesSummary) return <td>--</td>;
    return (
      <td className="nowrap" style={this.cellStyle}>
        {this.getCurrentDisplayDate(data.ResponsesSummary)}
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
  renderNumAnsweredCell(data) {
    return (
      <td valign="middle" style={this.cellStyle}>
        {this.getNumAnswered(data)}
      </td>
    );
  }
  renderScoreMeaningCell(data) {
    return (
      <td className="text-capitalize" valign="middle" style={this.cellStyle}>
        {this.getScoreMeaning(data)}
      </td>
    );
  }
  renderCompareToLastCell(data) {
    return (
      <td valign="middle" style={this.cellStyle}>
        <div className="icon-container">{this.getDisplayIcon(data)}</div>
      </td>
    );
  }
  renderDataRows(summary, showAnchorLinks) {
    return summary.map((item, index) => {
      return (
        <tr key={`questionnaire_summary_row_${index}`} className="data-row">
          {this.renderQuestionnaireLinkCell(item, showAnchorLinks)}
          {this.renderScoreCell(item)}
          {this.renderDateCell(item)}
          {this.renderNumAnsweredCell(item)}
          {this.renderScoreMeaningCell(item)}
          {this.renderCompareToLastCell(item)}
        </tr>
      );
    });
  }
  renderCopyButton() {
    return (
      <CopyButton
        buttonTitle="Click to copy scoring summary table"
        elementToCopy={this.tableRef.current}
      ></CopyButton>
    );
  }
  hasNoSummaryData(summary) {
    return (
      !summary ||
      !summary.length ||
      summary.filter(
        (item) => item.ResponsesSummary && item.ResponsesSummary.length > 0
      ).length === 0
    );
  }
  renderTitle() {
    return (
      <h3
        className="panel-title"
        style={{
          marginBottom: 0,
          fontSize: "1em",
          marginTop: 0,
          marginBlockStart: 0,
          marginBlockEnd: 0
        }}
      >
        {this.getTitleDisplay()}
      </h3>
    );
  }
  render() {
    const { summary, showAnchorLinks } = this.props;
    const noSummaryData = this.hasNoSummaryData(summary);
    return (
      <React.Fragment>
        <table
          className="table score-summary-table"
          ref={this.tableRef}
          style={this.tableStyle}
        >
          <caption style={{margin: "0 0 4px"}}>
            <div style={this.captionRowStyle}>
              {this.renderTitle()}
              <div style={{ textAlign: "right" }}>
                {this.renderCopyButton()}
              </div>
            </div>
          </caption>
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
