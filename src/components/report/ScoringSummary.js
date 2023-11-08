import React, { Component } from "react";
import PropTypes from "prop-types";
import Score from "./Score";
import PassUpArrowIcon from "../../icons/PassUpArrowIcon";
import FailUpArrowIcon from "../../icons/FailUpArrowIcon";
import FailDownArrowIcon from "../../icons/FailDownArrowIcon";
import PassDownArrowIcon from "../../icons/PassDownArrowIcon";
import LineIcon from "../../icons/LineIcon";
import { isNumber } from "../../helpers/utility";

export default class ScoringSummary extends Component {
  sortData(data) {
    if (!data || !Array.isArray(data)) return [];
    return data.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  getDataByIndex(data, index) {
    if (!data || data.length === 0) return null;
    const sortedData = this.sortData(data);
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
        : ""; // TODO get it from response summary data
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
      return null;
    }
  }
  getRangeDisplay(data) {
    if (!data || !data.ScoreParams) return null;
    const minScore = data.ScoreParams.minScore;
    const maxScore = data.ScoreParams.maxScore;
    return (
      <span className="text-muted sub">
        {"(" + minScore + "-" + maxScore + ")"}
      </span>
    );
  }
  getNumAnswered(data) {
    if (!this.getCurrentData(data.ResponsesSummary)) return null;
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
    return this.props.title || "Scoring Summary";
  }
  handleGoToSection(event, id) {
    event.preventDefault();
    const targetElement = document.querySelector(id);
    if (!targetElement) return;
    targetElement.scrollIntoView();
  }
  renderTableHeaders() {
    return (
      <thead>
        <tr>
          <th className="empty"></th>
          <th>Score</th>
          <th># Answered</th>
          <th className="text-center">Meaning</th>
          <th>Compare to Last</th>
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
    const questionnaireName = questionnaireObj.QuestionnaireName;
    if (!questionnaireName) return <td>--</td>;
    const anchorId = `#${questionnaireName}_title`;
    return (
      <td className="text-left">
        {showAnchorLinks && (
          <span>
            <b>
              <a
                className="anchor"
                href={`${anchorId}`}
                onClick={(e) => this.handleGoToSection(e, anchorId)}
                title={`Go to see more detail about ${questionnaireName}`}
              >
                {questionnaireName.toUpperCase()}
              </a>
            </b>
          </span>
        )}
        {!showAnchorLinks && <span>{questionnaireName.toUpperCase()}</span>}
      </td>
    );
  }
  renderScoreCell(data) {
    if (!data || !data.ResponsesSummary) return <td>--</td>;
    return (
      <td style={{ whiteSpace: "nowrap" }}>
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
          <td>{this.getNumAnswered(item)}</td>
          <td className="text-capitalize">{this.getScoreMeaning(item)}</td>
          <td>
            <div className="icon-container">{this.getDisplayIcon(item)}</div>
          </td>
        </tr>
      );
    });
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
        <div className="panel-title">{this.getTitleDisplay()}</div>
        <table className="table">
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
