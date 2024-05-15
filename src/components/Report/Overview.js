import React, { Component } from "react";
import PropTypes from "prop-types";
import ScoringSummary from "./ScoringSummary";
import BodyDiagram from "./BodyDiagram";
import SurveyGraph from "../graph/SurveyGraph";
import * as reportUtil from "./utility";

export default class Overview extends Component {
  constructor() {
    super(...arguments);
    this.summaryHTML = "";
    this.SurveyGraphRef = React.createRef();
  }
  hasNoSummaryData(summaryData) {
    return reportUtil.hasNoSummaryData(summaryData);
  }
  render() {
    const { summary, scoringData, graphData, bodyDiagramData } = this.props;
    const containerStyle = {
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    };
    const noEntriesStyleClass = this.hasNoSummaryData(summary)
      ? "no-entries"
      : "";
    return (
      <div className="panel-container">
        <div className={`panel graph ${noEntriesStyleClass}`}>
          <SurveyGraph data={graphData} ref={this.SurveyGraphRef}></SurveyGraph>
        </div>
        <div className={`panel ${noEntriesStyleClass}`}>
          <div className="panel__item bordered full-width score-panel">
            <ScoringSummary
              summary={scoringData}
              showAnchorLinks={true}
            ></ScoringSummary>
          </div>
          {bodyDiagramData && (
            <div className="panel__item bordered" style={containerStyle}>
              <BodyDiagram summary={bodyDiagramData}></BodyDiagram>
            </div>
          )}
        </div>
      </div>
    );
  }
}
Overview.propTypes = {
  summary: PropTypes.array,
};
