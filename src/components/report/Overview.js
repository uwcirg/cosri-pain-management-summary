import React, { Component } from "react";
import PropTypes from "prop-types";
import ScoringSummary from "./ScoringSummary";
import BodyDiagram from "./BodyDiagram";
import SurveyGraph from "../graph/SurveyGraph";

export default class Overview extends Component {
  getGraphData(summaryData) {
    if (!summaryData) return [];
    let data = [];
    summaryData.forEach((item) => {
      if (!item.ResponsesSummary || !item.ResponsesSummary.length) return true;
      console.log("item ", item)
      if (item.ReportOnce) return true;
      data = [...data, ...item.ResponsesSummary];
    });
    return data;
  }
  getBodyDiagramDataSummaryData(summaryData) {
    if (!summaryData) return null;
    const matchedData = summaryData
      .filter((item) => String(item.dataKey).toLowerCase() === "body diagram");
    if (!matchedData.length) return null;
    if (!matchedData[0].ResponsesSummary || !matchedData[0].ResponsesSummary.length) return null;
    return matchedData[0].ResponsesSummary;
  }
  render() {
    const { summary } = this.props;
    const dataToShow = summary.filter((item) => !item.ExcludeFromScoring);
    const graphData = this.getGraphData(dataToShow);
    const BodyDiagramData = this.getBodyDiagramDataSummaryData(summary);
    const noSummaryData =
      !summary ||
      !summary.length ||
      summary.filter(
        (item) => item.ResponsesSummary && item.ResponsesSummary.length > 0
      ).length === 0;
    return (
      <div className="panel-container">
        {graphData.length > 0 && (
          <div className="panel graph">
            <SurveyGraph data={graphData}></SurveyGraph>
          </div>
        )}
        <div className={`panel ${noSummaryData ? "no-entries" : ""}`}>
          {/* <div className="panel__item">Alerts go here</div> */}
          <div className="panel__item bordered full-width">
            <ScoringSummary
              summary={dataToShow}
              showAnchorLinks={true}
            ></ScoringSummary>
          </div>
          {BodyDiagramData && (
            <div
              className="panel__item bordered"
              style={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
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
