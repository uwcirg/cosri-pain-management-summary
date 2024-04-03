import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Score from "./Score";
import { getDisplayDateFromISOString } from "../../helpers/utility";

let resizeTimeoutId = 0;
export default class ResponsesSummary extends Component {
  constructor() {
    super(...arguments);
    this.state = { open: false };
    this.tableWrapperRef = React.createRef();
    this.setWrapperHeight = this.setWrapperHeight.bind(this);
    const BORDER_COLOR = "#f3f6f9";
    const HEADER_BORDER_COLOR = "#217684";
    this.tableStyle = {
      borderCollapse: "collapse",
      border: `1px solid ${BORDER_COLOR}`,
      padding: "4px",
    };
    this.cellStyle = {
      borderRight: `1px solid ${BORDER_COLOR}`,
      borderLeft: `1px solid ${BORDER_COLOR}`,
      borderBottom: `1px solid ${BORDER_COLOR}`,
      padding: "4px",
    };
    this.headerCellStyle = {
      borderTop: `1px solid ${BORDER_COLOR}`,
      borderRight: `1px solid ${BORDER_COLOR}`,
      borderLeft: `1px solid ${BORDER_COLOR}`,
      borderBottom: `2px solid ${HEADER_BORDER_COLOR}`,
    };
  }
  componentDidMount() {
    // resize table to be within viewport
    window.addEventListener("resize", this.setWrapperHeight);
    this.setWrapperHeight();
  }
  setWrapperHeight() {
    clearTimeout(resizeTimeoutId);
    const GUTTER_TOP_HEIGHT = 200; // include section title and summary at top
    setTimeout(() => {
      if (this.tableWrapperRef.current) {
        this.tableWrapperRef.current.style.maxHeight =
          window.innerHeight - GUTTER_TOP_HEIGHT + "px";
      }
    }, 250);
  }
  getMatchedAnswerTextByLinkId(summary, linkId, answerValue) {
    const reportedAnswerValue =
      answerValue == null || answerValue === "" ? "--" : answerValue;
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
          item.value && item.value.display && item.value.display.value
            ? item.value.display.value
            : answerValue
        );
      if (matchedOption.length && matchedOption[0]) return matchedOption[0];
      else return reportedAnswerValue;
    } else return reportedAnswerValue;
  }
  getMatchedAnswerByItem(summary, targetItem) {
    if (!targetItem) return "--";
    if (!summary || !summary.responses || !Array.isArray(summary.responses))
      return "--";
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
  hasResponses(summary) {
    if (
      !summary ||
      !summary.ResponsesSummary ||
      !Array.isArray(summary.ResponsesSummary) ||
      !summary.ResponsesSummary.length
    )
      return false;
    return true;
  }
  getCurrentResponses(summary) {
    if (!this.hasResponses(summary)) return null;
    return summary.ResponsesSummary[0];
  }
  getDisplayDate(targetObj) {
    if (!targetObj || !targetObj.date) return "--";
    return getDisplayDateFromISOString(targetObj.date);
  }
  getNumResponses(summary) {
    if (!this.hasResponses(summary)) return 0;
    return summary.ResponsesSummary.length;
  }
  renderResponses(qid, summaryItems, endIndex) {
    if (!summaryItems || !Array.isArray(summaryItems) || !summaryItems.length) {
      return <div>No recorded responses</div>;
    }
    const headerCellStyle = {
      border: "1px solid #217684",
      padding: "4px",
    };
    const cellStyle = {
      border: "1px solid #d8d8d8",
      padding: "4px",
    };
    return (
      <table
        className={`response-table ${this.state.open ? "active" : ""}`}
        style={{ borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th className="fixed-cell" style={headerCellStyle}>{`${
              qid ? qid.toUpperCase() : ""
            } Questions`}</th>
            {summaryItems
              .slice(0, endIndex ? endIndex : summaryItems.length)
              .map((item) => {
                return (
                  <th
                    key={`response_header_${item.id}`}
                    style={headerCellStyle}
                  >
                    {this.getDisplayDate(item)}
                  </th>
                );
              })}
          </tr>
        </thead>
        <tbody>
          {summaryItems[0].responses.map((item, rindex) => (
            <tr key={`response_row_${item.linkId}_${rindex}`}>
              <td className="fixed-cell" style={cellStyle}>
                {item.question.includes("score") ? (
                  <b>{item.question}</b>
                ) : (
                  item.question
                )}
              </td>
              <td style={cellStyle}>
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
                      <td
                        key={`${item.id}_response_${index}`}
                        style={cellStyle}
                      >
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
              <th
                key={`header_${column.key}_${index}`}
                style={this.headerCellStyle}
              >
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
          <th style={this.headerCellStyle}>Score</th>
          <th style={this.headerCellStyle}>Responses Completed</th>
          <th style={this.headerCellStyle}>Responses</th>
        </tr>
      </thead>
    );
  }
  renderTableBody(columns, summary) {
    const currentResponses = !this.hasResponses(summary)
      ? null
      : this.getCurrentResponses(summary);
    return (
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
                return this.renderNumResponsesTableCell(
                  summary,
                  `${column.key}_index`
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
                      valign="middle"
                    >
                      {currentResponses[column.key]}
                    </td>
                  );
                else
                  return (
                    <td
                      className="text-center"
                      key={`${column.key}_${index}`}
                      valign="middle"
                    >
                      --
                    </td>
                  );
              }
            })}
          {!columns && (
            <React.Fragment>
              {this.renderScoreTableCell(summary, `score_cell`)}
              {this.renderNumResponsesTableCell(summary, `num_response_cell`)}
              {this.renderResponsesLinkTableCell(
                this.getDisplayDate(currentResponses),
                "responses_cell"
              )}
            </React.Fragment>
          )}
        </tr>
      </tbody>
    );
  }
  renderScoreTableCell(summary, key) {
    if (!this.hasResponses(summary))
      return (
        <td cssClass="text-center" style={this.cellStyle}>
          --
        </td>
      );
    const score = summary.ResponsesSummary[0].score;
    const scoreParams = summary.ResponsesSummary[0];
    return (
      <td className="text-center" key={key} style={this.cellStyle}>
        <Score
          score={score}
          scoreParams={scoreParams}
          cssClass="flex-center"
          key={key}
        ></Score>
      </td>
    );
  }
  renderNumResponsesTableCell(summary, key) {
    if (!this.hasResponses(summary))
      return (
        <td className="text-center" key={key} style={this.cellStyle}>
          --
        </td>
      );
    return (
      <td className="text-center" key={key} style={this.cellStyle}>
        {this.getNumResponses(summary) || "--"}
      </td>
    );
  }
  renderResponsesLinkTableCell(lastResponsesDate, key) {
    return (
      <td key={key} style={this.cellStyle}>
        <div
          role="presentation"
          className={`link-container ${this.state.open ? "active" : ""}`}
          onClick={(e) => {
            this.setState({ open: !this.state.open }, () => {
              if (this.state.open) {
                if (this.tableWrapperRef.current) {
                  setTimeout(
                    () =>
                      this.tableWrapperRef.current.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                      }),
                    100
                  );
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
  rendeAccordionContent(summary) {
    if (!this.hasResponses(summary)) return null;
    const wrapperClass =
      summary.ResponsesSummary && summary.ResponsesSummary.length === 1
        ? "two-columns"
        : "";
    return (
      <div className={`accordion-content ${this.state.open ? "active" : ""}`}>
        <div className="responses-table-outer-wrapper print-hidden">
          <div
            className={`response-table-wrapper print-hidden ${wrapperClass}`}
            ref={this.tableWrapperRef}
          >
            {this.renderResponses(
              summary.QuestionnaireName,
              summary.ResponsesSummary
            )}
          </div>
        </div>
        <div className="print-only">
          {this.renderResponses(
            summary.QuestionnaireName,
            summary.ResponsesSummary,
            3
          )}
        </div>
      </div>
    );
  }
  renderSummary(summary, columns) {
    const noResponses = !this.hasResponses(summary);
    if (noResponses)
      return <div className="no-entries">No recorded responses</div>;
    return (
      <React.Fragment>
        <table
          className="table responses-summary-table"
          style={this.tableStyle}
        >
          {this.renderTableHeader(columns)}
          {this.renderTableBody(columns, summary)}
        </table>
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
