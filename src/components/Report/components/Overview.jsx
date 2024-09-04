import React, { Component } from "react";
import PropTypes from "prop-types";
import ScoringSummary from "./ScoringSummary";
import BodyDiagram from "./BodyDiagram";
import ReportOverviewGraph from "../../graph/ReportOverviewGraph";
import * as reportUtil from "../utility";

export default class Overview extends Component {
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
    if (this.hasNoSummaryData(summary)) {
      return (
        <div className={`overview ${noEntriesStyleClass}`}>No data to show</div>
      );
    }
    return (
      <div className="panel-container">
        <div className={`panel graph`}>
          <ReportOverviewGraph data={graphData}
          ></ReportOverviewGraph>
        </div>
        <div className={`panel`}>
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
