import React, { Component } from "react";
import PropTypes from "prop-types";
import ScoringSummary from "./ScoringSummary";
import SurveyGraph from "../graph/SurveyGraph";

export default class Overview extends Component {
  getGraphData(summaryData) {
    if (!summaryData) return [];
    let data = [];
    summaryData.forEach((item) => {
      if (!item.ResponsesSummary) return true;
      const surveyData = item.ResponsesSummary.map((o) => {
        o.qid = item.QuestionnaireName;
        return o;
      });
      data = [...data, ...surveyData];
    });
    return data;
  }
  render() {
    const { summary } = this.props;
    const graphData = this.getGraphData(summary);
    return (
      <div className="panel-container">
        {graphData.length > 0 && (
          <div className="panel graph">
            <SurveyGraph data={graphData}></SurveyGraph>
          </div>
        )}
        <div className="panel">
          {/* <div className="panel__item">Alerts go here</div> */}
          <div className="panel__item">
            <ScoringSummary summary={summary}></ScoringSummary>
          </div>
        </div>
      </div>
    );
  }
}
Overview.propTypes = {
  summary: PropTypes.array,
};
