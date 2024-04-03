import React, { Component } from "react";
import PropTypes from "prop-types";
import ScoringSummary from "./ScoringSummary";
import BodyDiagram from "./BodyDiagram";
import SurveyGraph from "../graph/SurveyGraph";

export default class Overview extends Component {
  constructor() {
    super(...arguments);
    this.summaryHTML = "";
    this.SurveyGraphRef = React.createRef();
  }
  hasNoSummaryData(summaryData) {
    return (
      !summaryData ||
      !summaryData.length ||
      summaryData.filter(
        (item) => item.ResponsesSummary && item.ResponsesSummary.length > 0
      ).length === 0
    );
  }
  getScoringData(summaryData) {
    return summaryData && Array.isArray(summaryData)
      ? summaryData.filter((item) => !item.ExcludeFromScoring)
      : [];
  }
  getGraphData(summaryData) {
    if (!summaryData) return [];
    let data = [];
    summaryData.forEach((item) => {
      if (!item.ResponsesSummary || !item.ResponsesSummary.length) return true;
      if (item.ReportOnce) return true;
      data = [...data, ...item.ResponsesSummary];
    });
    return data;
  }
  getBodyDiagramDataSummaryData(summaryData) {
    if (!summaryData || !Array.isArray(summaryData)) return null;
    const matchedData = summaryData.filter(
      (item) => String(item.dataKey).toLowerCase() === "body_diagram"
    );
    if (!matchedData.length) return null;
    if (
      !matchedData[0].ResponsesSummary ||
      !matchedData[0].ResponsesSummary.length
    )
      return null;
    return matchedData[0].ResponsesSummary;
  }
  render() {
    const { summary } = this.props;
    const dataToShow = this.getScoringData(summary);
    const graphData = this.getGraphData(dataToShow);
    const BodyDiagramData = this.getBodyDiagramDataSummaryData(summary);
    const containerStyle = {
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    };
    return (
      <div className="panel-container">
        <div className="panel graph">
          <SurveyGraph data={graphData} ref={this.SurveyGraphRef}></SurveyGraph>
        </div>
        <div className={`panel ${this.hasNoSummaryData(summary) ? "no-entries" : ""}`}>
          <div className="panel__item bordered full-width score-panel">
            <ScoringSummary
              summary={dataToShow}
              showAnchorLinks={true}
            ></ScoringSummary>
          </div>
          {BodyDiagramData && (
            <div className="panel__item bordered" style={containerStyle}>
              <BodyDiagram summary={BodyDiagramData}></BodyDiagram>
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
