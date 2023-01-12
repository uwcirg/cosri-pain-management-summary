import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Score from "./Score";

export default class ResponsesSummary extends Component {
  constructor() {
    super(...arguments);
    this.state = { open: false };
  }
  getMatchedLinkIdAnswer(responses, linkId) {
    if (!linkId) return null;
    if (!responses) return null;
    const matchedItem = responses.filter((item) => item.linkId === linkId);
    if (!matchedItem.length) return null;
    return matchedItem[0].answer;
  }
  getCurrentResponses(summary) {
    if (
      !summary ||
      !summary.ResponsesSummary ||
      !summary.ResponsesSummary.length
    )
      return null;
    return summary.ResponsesSummary[0];
  }
  getPrevResponses(summary) {
    if (!this.getCurrentResponses(summary)) return null;
    if (summary.ResponsesSummary.length <= 1) return null;
    return summary.ResponsesSummary[1];
  }
  getDisplayDate(targetObj) {
    if (!targetObj) return "--";
    const objDate = targetObj.date ? new Date(targetObj.date) : null;
    if (objDate) {
      let tzOffset = objDate.getTimezoneOffset() * 60000;
      objDate.setTime(objDate.getTime() + tzOffset);
    }
    const displayDate = objDate
      ? objDate.toLocaleDateString("en-us", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
      : "";
    return displayDate;
  }
  renderResponses(currentResponses, prevResponses) {
    const hasScores = !isNaN(currentResponses.score) || !isNaN(prevResponses.score);
    return (
      <table className={`response-table ${this.state.open ? "active" : ""}`}>
        <thead>
          <tr>
            <th></th>
            {currentResponses && (
              <th>Most recent ( {this.getDisplayDate(currentResponses)} )</th>
            )}
            {prevResponses && (
              <th>From last ( {this.getDisplayDate(prevResponses)} )</th>
            )}
          </tr>
        </thead>
        <tbody>
          {currentResponses.responses.map((item, index) => (
            <tr key={`response_row_${item.id}_${index}`}>
              <td>{item.question}</td>
              <td>{item.answer}</td>
              {prevResponses && (
                <td>
                  {this.getMatchedLinkIdAnswer(
                    prevResponses.responses,
                    item.linkId
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
        {hasScores && (
          <tfoot>
            <tr>
              <td>
                <b>Score</b>
              </td>
              <td>
                <Score
                  score={currentResponses.score}
                  scoreParams={currentResponses}
                ></Score>
              </td>
              {prevResponses && (
                <td>
                  <Score
                    score={prevResponses.score}
                    scoreParams={prevResponses}
                  ></Score>
                </td>
              )}
            </tr>
          </tfoot>
        )}
      </table>
    );
  }
  renderSummary(summary) {
    console.log("summary ", summary);
    const currentResponses = this.getCurrentResponses(summary);
    const prevResponses = this.getPrevResponses(summary);
    const noResponses = !currentResponses && !prevResponses;
    return (
      <React.Fragment>
        <table className="table">
          <thead>
            <tr>
              <th>Score</th>
              <th>Responses Completed</th>
              <th>Responses</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <Score
                  score={summary.FullScore}
                  scoreParams={summary.ResponsesSummary[0]}
                ></Score>
              </td>
              <td>{summary.ResponsesSummary.length}</td>
              {noResponses && <td>--</td>}
              {!noResponses && (
                <td>
                  <div
                    role="presentation"
                    className={`link-container ${
                      this.state.open ? "active" : ""
                    }`}
                    onClick={(e) => this.setState({ open: !this.state.open })}
                  >
                    <div className="info-icon text-bold">
                      Last responded on {this.getDisplayDate(currentResponses)}
                    </div>
                    <FontAwesomeIcon
                      className="icon"
                      icon="chevron-right"
                      title="expand/collapse"
                    />
                  </div>
                </td>
              )}
              {/* {!noResponses && (
                <td>
                  {currentResponses &&
                    this.renderResponseLink("most recent", currentResponses)}
                </td>
              )}
              {!noResponses && (
                <td>
                  {prevResponses &&
                    this.renderResponseLink("from last", prevResponses)}
                </td>
              )} */}
            </tr>
          </tbody>
        </table>
        <div className={this.state.open ? "show" : "hide"}>
          {this.renderResponses(currentResponses, prevResponses)}
        </div>
      </React.Fragment>
    );
  }
  render() {
    const summary = this.props.summary;
    if (!summary) return <div className="no-entries">No entries found</div>;
    return this.renderSummary(summary);
  }
}

ResponsesSummary.propTypes = {
  summary: PropTypes.object,
};
