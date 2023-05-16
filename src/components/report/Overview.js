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
      if (!item.ResponsesSummary) return true;
      data = [...data, ...item.ResponsesSummary];
    });
    return data;
  }
  getAnswersFromFhirObjects(fhirObjects, description = "pain") {
    if (!fhirObjects) return null;
    let answers = null;
    fhirObjects.forEach((key) => {
      if (!answers) answers = {};
      answers[key] =
        answers[key] && answers[key].length
          ? [...answers[key], description]
          : [description];
    });
    return answers;
  }
  getBodyDiagramData(summaryData) {
    if (!summaryData) return null;
    const matchedData = summaryData.filter(
      (item) => String(item.dataKey).toLowerCase() === "body diagram"
    );
    if (!matchedData.length) return null;
    if (
      !matchedData[0].ResponsesSummary ||
      !matchedData[0].ResponsesSummary.length
    )
      return null;
    const responses = matchedData[0].ResponsesSummary[0];
    const painLocations = responses.painLocations;
    let answers = null;
    if (painLocations && painLocations.length) {
      answers = this.getAnswersFromFhirObjects(painLocations);
    }
    const severePainLocation = responses.severePainLocation;
    if (severePainLocation && severePainLocation.length) {
      if (!answers) answers = {};
      answers = {
        ...answers,
        ...this.getAnswersFromFhirObjects(severePainLocation, "severe_pain"),
      };
    }
    return answers;
  }
  render() {
    const { summary } = this.props;
    const dataToShow = summary.filter((item) => !item.ExcludeFromScoring);
    const graphData = this.getGraphData(dataToShow);
    const BodyDiagramData = this.getBodyDiagramData(summary);
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
              <BodyDiagram
              answers={this.getBodyDiagramData(summary)}
            ></BodyDiagram>
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
