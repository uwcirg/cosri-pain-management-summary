import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Score from "./Score";

export default class ResponsesSummary extends Component {
  constructor() {
    super(...arguments);
    this.state = { open: false };
  }
  getMatchedAnswerTextByLinkId(summary, linkId, answerValue) {
    const reportedAnswerValue = answerValue || "--";
    if (
      !summary ||
      !summary.questionnaireItems ||
      !summary.questionnaireItems.length
    )
      return reportedAnswerValue;
    const matchedItem = summary.questionnaireItems.filter((item) => {
      return (
        String(item.linkId.value).includes(linkId) ||
        String(linkId).includes(item.linkId.value)
      );
    });
    if (!matchedItem.length) return reportedAnswerValue;
    const answerOption = matchedItem[0].answerOption;
    if (answerOption && answerOption.length) {
      const matchedOption = answerOption
        .filter((option) => {
          const extension = option.extension;
          if (extension && extension.length) {
            const matchedExtensions = extension.filter(
              (o) => o.value && o.value.value === answerValue
            );
            return matchedExtensions.length > 0;
          } else return false;
        })
        .map((item) =>
          item.value && item.value.display
            ? item.value.display.value
            : answerValue
        );
      if (matchedOption.length) return (matchedOption[0]) || "--";
      else return reportedAnswerValue;
    } else return reportedAnswerValue;
  }
  getMatchedAnswerByItem(summary, targetItem) {
    if (!targetItem) return null;
    if (!summary || !summary.responses) return "--";
    const matchedItem = summary.responses.filter(
      (item) =>
        String(item.linkId).includes(targetItem.linkId) ||
        String(targetItem.linkId).includes(item.linkId) ||
        item.question === targetItem.question
    );
    if (!matchedItem.length) return "--";
    return (
      this.getMatchedAnswerTextByLinkId(
        summary,
        targetItem.linkId,
        matchedItem[0].answer
      ) || "--"
    );
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
    return summary.ResponsesSummary.length;
  }
  renderResponses(currentResponses, prevResponses) {
    if (!currentResponses && !prevResponses) {
      return <div>No recorded responses</div>;
    }
    const hasScores =
      (currentResponses &&
        !isNaN(currentResponses.score) &&
        !currentResponses.responses.some((item) =>
          item.question.includes("score")
        )) ||
      (prevResponses &&
        !isNaN(prevResponses.score) &&
        !prevResponses.responses.some((item) =>
          item.question.includes("score")
        ));
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
            <tr key={`response_row_${item.linkId}_${index}`}>
              <td>
                {item.question.includes("score") ? (
                  <b>{item.question}</b>
                ) : (
                  item.question
                )}
              </td>
              <td>
                {item.answer || parseInt(item.answer) === 0
                  ? this.getMatchedAnswerTextByLinkId(
                      currentResponses,
                      item.linkId,
                      item.answer
                    )
                  : "--"}
              </td>
              {prevResponses && (
                <td>{this.getMatchedAnswerByItem(prevResponses, item)}</td>
              )}
            </tr>
          ))}
        </tbody>
        {hasScores && (
          <tfoot>
            <tr>
              <td>
                <b>
                  {currentResponses.scoreDescription
                    ? currentResponses.scoreDescription
                    : "Score"}
                </b>
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
  renderTableHeader(columns) {
    if (columns) {
      return (
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={`header_${column.key}_${index}`}>
                {column.description}
              </th>
            ))}
          </tr>
        </thead>
      );
    }
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
  renderScoreTableCell(summary, key) {
    const hasSummary =
      summary && summary.ResponsesSummary && summary.ResponsesSummary.length;
    if (!hasSummary) return <td cssClass="text-center">--</td>;
    const score = summary.ResponsesSummary[0].score;
    const scoreParams = summary.ResponsesSummary[0];
    return (
      <td className="text-center" key={key}>
        <Score
          score={score}
          scoreParams={scoreParams}
          cssClass="flex-center"
          key={key}
        ></Score>
      </td>
    );
  }
  renderNumResponsesTableCell(summary) {
    const hasSummary =
      summary && summary.ResponsesSummary && summary.ResponsesSummary.length;
    if (!hasSummary) return <td className="text-center">--</td>;
    return (
      <td className="text-center">{this.getNumResponses(summary) || "--"}</td>
    );
  }
  renderResponsesLinkTableCell(lastResponsesDate, key) {
    return (
      <td key={key}>
        <div
          role="presentation"
          className={`link-container ${this.state.open ? "active" : ""}`}
          onClick={(e) => this.setState({ open: !this.state.open })}
        >
          {lastResponsesDate && <span>Last on {lastResponsesDate}</span>}

          <FontAwesomeIcon
            className="icon"
            icon="chevron-right"
            title="expand/collapse"
          />
        </div>
      </td>
    );
  }
  renderSummary(summary, columns) {
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
          {this.renderTableHeader(columns)}
          <tbody>
            <tr>
              {columns &&
                columns.map((column, index) => {
                  if (column.key === "score")
                    return this.renderScoreTableCell(
                      summary,
                      `score_cell_${index}`
                    );
                  else if (column.key === "responses")
                    return this.renderResponsesLinkTableCell(
                      this.getDisplayDate(currentResponses),
                      `responses_cell_${index}`
                    );
                  else {
                    if (currentResponses[column.key])
                      return (
                        <td
                          className="text-center"
                          key={`${column.key}_${index}`}
                        >
                          {currentResponses[column.key]}
                        </td>
                      );
                    else
                      return (
                        <td
                          className="text-center"
                          key={`${column.key}_${index}`}
                        >
                          --
                        </td>
                      );
                  }
                })}
              {!columns && (
                <React.Fragment>
                  {this.renderScoreTableCell(summary, `score_cell`)}
                  {this.renderNumResponsesTableCell(summary)}
                  {this.renderResponsesLinkTableCell(
                    this.getDisplayDate(currentResponses),
                    "responses_cell"
                  )}
                </React.Fragment>
              )}
            </tr>
          </tbody>
        </table>
        <div className={`accordion-content ${this.state.open ? "active" : ""}`}>
          {this.renderResponses(currentResponses, prevResponses)}
        </div>
      </React.Fragment>
    );
  }
  render() {
    return this.renderSummary(this.props.summary, this.props.columns);
  }
}

ResponsesSummary.propTypes = {
  summary: PropTypes.object,
  columns: PropTypes.array,
};
