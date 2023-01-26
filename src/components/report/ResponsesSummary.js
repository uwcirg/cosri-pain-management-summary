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
    // need to account for timezone offset for a UTC date/time
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
  getNumResponses(summary) {
    if (!summary || !summary.ResponsesSummary) return 0;
    return summary.ResponsesSummary.length
  }
  renderResponses(currentResponses, prevResponses) {
    if (!currentResponses && !prevResponses)
      return <div>No recorded responses</div>;
    const hasScores =
      (currentResponses && !isNaN(currentResponses.score)) ||
      (prevResponses && !isNaN(prevResponses.score));
    return (
      <table className={`response-table ${this.state.open ? "active" : ""}`}>
        <thead>
          <tr>
            <th>{/* no need for header for question */}</th>
            <th>Most recent ( {this.getDisplayDate(currentResponses)} )</th>
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
  renderTableHeader() {
    return (
      <thead>
        <tr>
          <th>Score</th>
          <th>Responses Completed</th>
          <th>Responses</th>
        </tr>
      </thead>
    );
  }
  renderScoreTableCell(summary) {
    const hasSummary =
      summary && summary.ResponsesSummary && summary.ResponsesSummary.length;
    if (!hasSummary) return <td>--</td>;
    const score = summary.ResponsesSummary[0].score;
    const scoreParams = summary.ResponsesSummary[0];
    return (
      <td>
        <Score
          score={score}
          scoreParams={scoreParams}
        ></Score>
      </td>
    );
  }
  renderNumResponsesTableCell(summary) {
    const hasSummary =
      summary && summary.ResponsesSummary && summary.ResponsesSummary.length;
    if (!hasSummary) return <td>--</td>;
    return <td className="text-center">{this.getNumResponses(summary)}</td>;
  }
  renderResponsesLinkTableCell(lastResponsesDate) {
    return (
      <td>
        <div
          role="presentation"
          className={`link-container ${this.state.open ? "active" : ""}`}
          onClick={(e) => this.setState({ open: !this.state.open })}
        >
          <div className="info-icon text-bold">
            {lastResponsesDate && <span>Last responded on {lastResponsesDate}</span>}
          </div>
          <FontAwesomeIcon
            className="icon"
            icon="chevron-right"
            title="expand/collapse"
          />
        </div>
      </td>
    );
  }
  renderSummary(summary) {
    const noResponses =
      !summary || !summary.ResponsesSummary || !summary.ResponsesSummary.length;
    const currentResponses = noResponses
      ? null
      : this.getCurrentResponses(summary);
    const prevResponses = noResponses ? null : this.getPrevResponses(summary);
    if (noResponses)
      return <div className="no-entries">No recorded responses</div>;
    return (
      <React.Fragment>
        <table className="table">
          {this.renderTableHeader()}
          <tbody>
            <tr>
              {this.renderScoreTableCell(summary)}
              {this.renderNumResponsesTableCell(summary)}
              {this.renderResponsesLinkTableCell(
                this.getDisplayDate(currentResponses)
              )}
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
    return this.renderSummary(this.props.summary);
  }
}

ResponsesSummary.propTypes = {
  summary: PropTypes.object,
};
