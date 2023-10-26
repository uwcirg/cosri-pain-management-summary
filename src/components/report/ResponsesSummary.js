import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Score from "./Score";
import { getDisplayDateFromISOString } from "../../helpers/utility";

export default class ResponsesSummary extends Component {
  constructor() {
    super(...arguments);
    this.state = { open: false };
    this.tableRef = React.createRef();
  }
  getMatchedAnswerTextByLinkId(summary, linkId, answerValue) {
    const reportedAnswerValue = answerValue == null ? "--" : answerValue;
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
      if (matchedOption.length && matchedOption[0]) return matchedOption[0];
      else return reportedAnswerValue;
    } else return reportedAnswerValue;
  }
  getMatchedAnswerByItem(summary, targetItem) {
    if (!targetItem) return null;
    if (!summary || !summary.responses) return "--";
    const matchedItem = summary.responses.filter(
      (item) =>
        String(item.linkId).includes(targetItem.linkId) ||
        String(targetItem.linkId).includes(item.linkId)
    );
    if (!matchedItem.length) return "--";
    return this.getMatchedAnswerTextByLinkId(
      summary,
      targetItem.linkId,
      matchedItem[0].answer
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
  getDisplayDate(targetObj) {
    if (!targetObj) return "--";
    return getDisplayDateFromISOString(targetObj.date);
  }
  getNumResponses(summary) {
    if (!summary || !summary.ResponsesSummary) return 0;
    return summary.ResponsesSummary.length;
  }
  renderResponses(summaryItems, endIndex) {
    if (!summaryItems || !summaryItems.length) {
      return <div>No recorded responses</div>;
    }
    return (
      <table
        className={`response-table ${this.state.open ? "active" : ""}`}
        ref={this.tableRef}
      >
        <thead>
          <tr>
            <th className="fixed-cell">Questions</th>
            {summaryItems
              .slice(0, endIndex ? endIndex : summaryItems.length)
              .map((item, index) => {
                return (
                  <th key={`response_header_${item.id}`}>
                    {this.getDisplayDate(item)}
                  </th>
                );
              })}
          </tr>
        </thead>
        <tbody>
          {summaryItems[0].responses.map((item, rindex) => (
            <tr key={`response_row_${item.linkId}_${rindex}`}>
              <td className="fixed-cell">
                {item.question.includes("score") ? (
                  <b>{item.question}</b>
                ) : (
                  item.question
                )}
              </td>
              <td>
                {this.getMatchedAnswerTextByLinkId(
                  summaryItems[0],
                  item.linkId,
                  item.answer
                )}
              </td>
              {summaryItems.length > 1 &&
                summaryItems
                  .slice(1, endIndex ? endIndex : summaryItems.length)
                  .map((o, index) => {
                    return (
                      <td key={`${item.id}_response_${index}`}>
                        {this.getMatchedAnswerByItem(o, item)}
                      </td>
                    );
                  })}
            </tr>
          ))}
        </tbody>
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
          onClick={(e) => {
            this.setState({ open: !this.state.open }, () => {
              if (this.state.open) {
                if (this.tableRef.current) {
                  setTimeout(() => {
                    this.tableRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "end",
                    });
                  }, 250);
                }
              }
            });
          }}
        >
          {lastResponsesDate && <span>Last on {lastResponsesDate}</span>}

          <div className="icon">
            <FontAwesomeIcon icon="chevron-right" title="expand/collapse" />
          </div>
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
                  else if (column.key === "responses_completed")
                    return this.renderNumResponsesTableCell(summary);
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
          <div className="responses-table-outer-wrapper print-hidden">
            <div
              className={`response-table-wrapper print-hidden ${
                summary.ResponsesSummary &&
                summary.ResponsesSummary.length === 1
                  ? "two-columns"
                  : ""
              }`}
            >
              {this.renderResponses(summary.ResponsesSummary)}
            </div>
          </div>
          <div className="print-only">
            {this.renderResponses(summary.ResponsesSummary, 3)}
          </div>
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
