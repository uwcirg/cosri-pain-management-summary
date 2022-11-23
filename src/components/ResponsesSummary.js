import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default class ResponsesSummary extends Component {
  constructor() {
    super(...arguments);
    this.state = { activeItem: null };
    // This binding is necessary to make `this` work in the callback
    this.handleSetActiveItem = this.handleSetActiveItem.bind(this);
  }
  handleSetActiveItem(e, object) {
    e.preventDefault();
    this.setState({
      activeItem:
        !this.state.activeItem || this.state.activeItem.date !== object.date
          ? object
          : null,
    });
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
  renderResponseLink(text, targetObj) {
    if (!targetObj) return "--";
    const objDate = targetObj.date ? new Date(targetObj.date) : null;
    const displayDate = objDate
      ? objDate.toLocaleDateString("en-us", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
      : "";
    return (
      <div
        role="presentation"
        className={`link-container ${
          this.state.activeItem && this.state.activeItem.date === targetObj.date
            ? "active"
            : ""
        }`}
        onClick={(e) => this.handleSetActiveItem(e, targetObj)}
      >
        <span>{text}</span>
        <span className="date">{displayDate ? `(${displayDate})` : ""}</span>
        <span></span>
        <FontAwesomeIcon
          className="chevron icon"
          icon="chevron-right"
          title="expand/collapse"
        />
      </div>
    );
  }
  renderResponses() {
    if (!this.state.activeItem) return null;
    const responses = this.state.activeItem.responses;
    return (
      <table className="response-table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Answer</th>
          </tr>
        </thead>
        <tbody>
          {responses.map((item, index) => {
            return (
              <tr key={`response_${index}`}>
                <td>{item.question}</td>
                <td style={{width: "40%"}}>{item.answer}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
  renderSummary(summary) {
    const currentResponses = this.getCurrentResponses(summary);
    const prevResponses = this.getPrevResponses(summary);
    const noResponses = !currentResponses && !currentResponses;
    return (
      <React.Fragment>
        <table className="table">
          <thead>
            <tr>
              <th>Score</th>
              <th>Responses Completed</th>
              <th colspan={2}>Responses</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{summary.FullScore}</td>
              <td>{summary.ResponsesSummary.length}</td>
              {noResponses && <td colSpan={2}>--</td>}
              {!noResponses && (
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
              )}
            </tr>
          </tbody>
        </table>
        {this.renderResponses()}
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
