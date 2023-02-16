import React, { Component } from "react";
import PropTypes from "prop-types";
import ScoringSummary from "./ScoringSummary";
import SurveyGraph from "../graph/SurveyGraph";
import qConfig from "../../config/questionnaire_config";

export default class Overview extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      graphData: this.getGraphData(this.props.summary),
      originalGraphData: this.getGraphData(this.props.summary),
    };
    // This binding is necessary to make `this` work in the callback
    this.addQuestionnaireToSurveyGraph =
      this.addQuestionnaireToSurveyGraph.bind(this);
    this.removeQuestionnaireToSurveyGraph =
       this.removeQuestionnaireToSurveyGraph.bind(this);
  }
  isInSurveyGraph(qid) {
    return this.state.graphData.some((item) => item.qid === qid);
  }
  addQuestionnaireToSurveyGraph(qid) {
    if (this.isInSurveyGraph(qid)) return;
    const qData = this.state.originalGraphData.filter(item => item.qid === qid);
    if (qData && qData.length) this.setState({
      graphData: [...this.state.graphData, ...qData]
    })
  }
  removeQuestionnaireToSurveyGraph(qid) {
    if (!this.isInSurveyGraph(qid)) return;
    this.setState({
      graphData: this.state.graphData.filter(item => item.qid !== qid)
    });
  }
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
  renderLegend() {
    const qids = [...new Set(this.state.originalGraphData.map(item => item.qid))];
    return (
      <div className="legend">
        {qids.map((item, index) => (
          <div className="legend__item" key={`legend_${item}_${index}`}>
            <div>
              <span
                className="icon"
                style={{
                  backgroundColor: qConfig[item].graph.strokeColor,
                }}
              ></span>
              <span>{item.toUpperCase()}</span>
            </div>
            <div className="select-icons-container">
              <button
                className="select-icon"
                onClick={() => this.addQuestionnaireToSurveyGraph(item)}
                disabled={this.isInSurveyGraph(item) ? true : false}
                title={`Add ${item} to graph`}
              >
                +
              </button>
              <button
                className="select-icon"
                onClick={() => this.removeQuestionnaireToSurveyGraph(item)}
                disabled={this.isInSurveyGraph(item) ? false : true}
                title={`Remove ${item} from graph`}
              >
                -
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }
  render() {
    const { summary } = this.props;
    //const graphData = this.getGraphData(summary);
    const noSummaryData =
      !summary ||
      !summary.length ||
      summary.filter(
        (item) => item.ResponsesSummary && item.ResponsesSummary.length > 0
      ).length === 0;
    return (
      <div className="panel-container">
        {this.state.originalGraphData.length > 0 && (
          <div className="panel graph">
            <SurveyGraph data={this.state.graphData}></SurveyGraph>
            {this.renderLegend()}
          </div>
        )}
        <div className={`panel ${noSummaryData ? "no-entries" : ""}`}>
          {/* <div className="panel__item">Alerts go here</div> */}
          <div className="panel__item">
            <ScoringSummary
              summary={summary}
              showAnchorLinks={true}
            ></ScoringSummary>
          </div>
        </div>
      </div>
    );
  }
}
Overview.propTypes = {
  summary: PropTypes.array,
};
