import React, { Component } from "react";
import PropTypes from "prop-types";
import ScoringSummary from "./ScoringSummary";
import SurveyGraph from "./graph/SurveyGraph";

export default class Report extends Component {

  getGraphData(summaryData) {
    if (!summaryData) return [];
    let data = [];
    summaryData.forEach(item => {
      if (!item.ResponsesSummary) return true;
      const surveyData = item.ResponsesSummary.map(o => {
        o.qid = item.QuestionnaireName;
        return o;
      })
      data = [...data, ...surveyData];
    });
    return data;
  }
  
  render() {
    const { summaryData } = this.props;
    return (
      <section className="report">
        <div className="panel-container">
          <div className="panel graph">
            <SurveyGraph data={this.getGraphData(summaryData)}></SurveyGraph>
          </div>
          <div className="panel">
            {/* <div className="panel__item">Alerts go here</div> */}
            <div className="panel__item">
              <ScoringSummary
                summary={summaryData}
              ></ScoringSummary>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

Report.propTypes = {
  summaryData: PropTypes.array.isRequired,
};
