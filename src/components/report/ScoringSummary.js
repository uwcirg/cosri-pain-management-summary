import React, { Component } from "react";
import PropTypes from "prop-types";
import Score from "./Score";
import PassUpArrowIcon from "../../icons/PassUpArrowIcon";
import FailUpArrowIcon from "../../icons/FailUpArrowIcon";
import FailDownArrowIcon from "../../icons/FailDownArrowIcon";
import PassDownArrowIcon from "../../icons/PassDownArrowIcon";
import LineIcon from "../../icons/LineIcon";
import qConfig from "../../config/questionnaire_config";
import { isNumber } from "../../helpers/utility";

export default class ScoringSummary extends Component {
  sortData(data) {
    if (!data || !Array.isArray(data)) return [];
    return data.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  getCurrentData(data) {
    if (!data || data.length === 0) return null;
    const sortedData = this.sortData(data);
    return sortedData[0];
  }
  getPreviousScore(data) {
    if (!data || data.length === 0 || data.length === 1) return null;
    const sortedData = this.sortData(data);
    const score = sortedData[1].score;
    if (!isNumber(score)) return null;
    return parseInt(score);
  }
  getCurrentScore(data) {
    if (!data || data.length === 0) return null;
    const sortedData = this.sortData(data);
    console.log("sortedData ", sortedData)
    const score = sortedData[0].score;
    if (!isNumber(score)) return null;
    return parseInt(score);
  }
  getDisplayIcon(data) {
    const dataConfig = qConfig[data.QuestionnaireName];
    const comparisonToAlert = dataConfig ? dataConfig.comparisonToAlert : "";
    const currentScore = this.getCurrentScore(data.ResponsesSummary);
    const prevScore = this.getPreviousScore(data.ResponsesSummary);
    //debug
    console.log(
      "current score ",
      currentScore,
      "current score is number? ",
      isNumber(currentScore),
      "prev score ",
      prevScore,
      " prev score is number? ",
      isNumber(prevScore)
    );
    //debug
    // console.log("comparison to alert ", comparisonToAlert);
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
    const minScore = data.ScoreParams.minScore;
    const maxScore = data.ScoreParams.maxScore;
    return <span>{"(" + minScore + "-" + maxScore + ")"}</span>;
  }
  getCurrentDisplayScore(data) {
    if (!data) return "--";
    if (!data.ResponsesSummary || !data.ResponsesSummary.length) return "--";
    return isNumber(data.FullScore) ? data.FullScore : "--";
  }
  getTitleDisplay() {
    return this.props.title || "Scoring Summary";
  }
  renderTableHeaders() {
    return (
      <thead>
        <tr>
          <th>Questionnaire Name</th>
          <th>Score</th>
          <th>Compare to Last</th>
        </tr>
      </thead>
    );
  }
  renderNoDataRow() {
    return (
      <tr className="no-data-row">
        <td colSpan="3">
          <div className="no-entries">No data available</div>
        </td>
      </tr>
    );
  }
  renderDataRows(summary) {
    return summary.map((item, index) => {
      return (
        <tr key={`questionnaire_summary_row_${index}`} className="data-row">
          <td>{item.QuestionnaireName.toUpperCase()}</td>
          <td>
            <div className="flex">
              <Score
                score={this.getCurrentDisplayScore(item)}
                scoreParams={this.getCurrentData(item.ResponsesSummary)}
              ></Score>
              <div>{this.getRangeDisplay(item)}</div>
            </div>
          </td>
          <td>
            <div className="icon-container">{this.getDisplayIcon(item)}</div>
          </td>
        </tr>
      );
    });
  }
  render() {
    const { summary } = this.props;
    const noSummaryData =
      !summary ||
      !summary.length ||
      summary.filter((item) => item.ResponsesSummary && item.ResponsesSummary.length > 0).length  === 0;
    return (
      <table className="table">
        <caption>{this.getTitleDisplay()}</caption>
        {!noSummaryData && this.renderTableHeaders()}
        <tbody>
          {noSummaryData && this.renderNoDataRow()}
          {!noSummaryData && this.renderDataRows(summary)}
        </tbody>
      </table>
    );
  }
}

ScoringSummary.propTypes = {
  title: PropTypes.string,
  summary: PropTypes.array,
};
