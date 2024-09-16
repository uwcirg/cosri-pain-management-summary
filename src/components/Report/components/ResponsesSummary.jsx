import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CopyButton from "../../CopyButton";
import Score from "./Score";
import {
  getDisplayDateFromISOString,
  isEmptyArray,
} from "../../../helpers/utility";

let resizeTimeoutId = 0;
export default class ResponsesSummary extends Component {
  constructor() {
    super(...arguments);
    this.state = { open: false, copyInProgress: false };
    this.setWrapperHeight = this.setWrapperHeight.bind(this);
    this.buildElementForCopy = this.buildElementForCopy.bind(this);
    this.afterCopy = this.afterCopy.bind(this);

    //refs
    this.summaryContainerRef = React.createRef();
    this.summaryTableRef = React.createRef();
    this.tableWrapperRef = React.createRef();
    this.printOnlyContainerRef = React.createRef();
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
    if (!summary || isEmptyArray(summary.questionnaireItems))
      return reportedAnswerValue;
    const matchedItem = summary.questionnaireItems.find((item) => {
      return (
        String(item.linkId.value).includes(linkId) ||
        String(linkId).includes(item.linkId.value)
      );
    });
    if (!matchedItem) return reportedAnswerValue;
    const answerOption = matchedItem.answerOption;
    if (!isEmptyArray(answerOption)) {
      const matchedOption = answerOption
        .filter((option) => {
          const extension = option.extension;
          if (!isEmptyArray(extension)) {
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
      if (!isEmptyArray(matchedOption))
        return matchedOption[0];
      else return reportedAnswerValue;
    } else return reportedAnswerValue;
  }
  getMatchedAnswerByItem(summary, targetItem) {
    if (!targetItem) return "--";
    if (!summary || isEmptyArray(summary.responses)) return "--";
    const matchedItem = summary.responses.filter(
      (item) =>
        String(item.linkId).includes(targetItem.linkId) ||
        String(targetItem.linkId).includes(item.linkId)
    );
    if (isEmptyArray(matchedItem)) return "--";
    return this.getMatchedAnswerTextByLinkId(
      summary,
      targetItem.linkId,
      matchedItem[0].answer
    );
  }
  hasResponses(summary) {
    if (!summary || isEmptyArray(summary.ResponsesSummary)) return false;
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
    if (isEmptyArray(summaryItems)) {
      return <div>No recorded responses</div>;
    }
    return (
      <table
        className={`table response-table ${this.state.open ? "active" : ""}`}
      >
        <thead>
          <tr>
            <th className="fixed-cell text-center">
              {`${qid ? qid.toUpperCase() : ""}`} Questions
            </th>
            {summaryItems
              .slice(0, endIndex ? endIndex : summaryItems.length)
              .map((item, index) => {
                return (
                  <th
                    key={`response_header_${item.id}`}
                    className={index > 0 ? "exclude-from-copy text-center" : "text-center"}
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
                      <td
                        key={`${item.id}_response_${index}`}
                        className="exclude-from-copy"
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
                style={{
                  ...(index === columns.length - 1 ? { borderRight: 0 } : {}),
                }}
                colSpan={column.number ?? 1}
                className="accent"
              >
                {column.description}
              </th>
            ))}
            {/* view all responses column */}
            <th className="exclude-from-copy accent"></th>
          </tr>
        </thead>
      );
    }
    return (
      <thead>
        <tr>
          <th className="accent">Score</th>
          <th className="accent">Responses Completed</th>
          <th className="accent" style={{ borderRight: 0 }}>
            Responses
          </th>
          <th className="exclude-from-copy accent"></th>
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
                  `score_cell_${index}`,
                  column
                );
              else if (column.key === "responses_completed")
                return this.renderNumResponsesTableCell(
                  summary,
                  `${column.key}_index`,
                  column
                );
              else if (column.key === "responses")
                return this.renderResponsesLinkTableCells(
                  this.getDisplayDate(currentResponses),
                  `responses_cell_${index}`,
                  column
                );
              else {
                if (currentResponses[column.key])
                  return (
                    <td
                      className="text-center"
                      key={`${column.key}_${index}`}
                      valign="middle"
                      colSpan={column.number ?? 1}
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
              {this.renderResponsesLinkTableCells(
                this.getDisplayDate(currentResponses),
                "responses_cell"
              )}
            </React.Fragment>
          )}
        </tr>
      </tbody>
    );
  }
  renderScoreTableCell(summary, key, props) {
    if (!this.hasResponses(summary)) return <td className="text-center">--</td>;
    const score = summary.ResponsesSummary[0].score;
    const scoreParams = summary.ResponsesSummary[0];
    return (
      <td
        className="text-center"
        key={key}
        colSpan={props && props.number ? props.number : 1}
      >
        <Score
          score={score}
          scoreParams={scoreParams}
          cssClass="flex-center"
          key={key}
        ></Score>
      </td>
    );
  }
  renderNumResponsesTableCell(summary, key, props) {
    if (!this.hasResponses(summary))
      return (
        <td
          className="text-center"
          key={key}
          colSpan={props && props.number ? props.number : 1}
        >
          --
        </td>
      );
    return (
      <td
        className="text-center"
        key={key}
        colSpan={props && props.number ? props.number : 1}
      >
        {this.getNumResponses(summary) || "--"}
      </td>
    );
  }
  renderResponsesLinkTableCells(lastResponsesDate, key, props) {
    return (
      <React.Fragment key={key}>
        <td colSpan={props && props.number ? props.number : 1}>
          <div
            role="presentation"
            className={`link-container ${this.state.open ? "active" : ""}`}
          >
            <div className="flex" style={{ gap: "24px" }}>
              <div className="flex">
                {lastResponsesDate && <span>Last on {lastResponsesDate}</span>}
                <div className="exclude-from-copy">
                  {this.renderCopyButton()}
                </div>
              </div>
            </div>
          </div>
        </td>
        <td key={`${key}_viewAll`}>
          <div className="link-container exclude-from-copy">
            {this.renderViewButton()}
          </div>
        </td>
      </React.Fragment>
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
      </div>
    );
  }
  buildElementForCopy() {
    if (!this.summaryTableRef.current) return;
    const summaryElement = document.createElement("div");
    summaryElement.setAttribute("id", "tempSummaryEl");
    const sectionElement =
      this.summaryContainerRef.current.closest(".sub-section");
    const sectionHeaderElement = sectionElement
      ? sectionElement.querySelector(".sub-section__header__name")
      : null;
    let headerElement = sectionHeaderElement
      ? sectionHeaderElement.cloneNode(true)
      : null;
    
    if (headerElement) {
      headerElement.style.fontWeight = 600;
      summaryElement.appendChild(headerElement);
    }
    let summaryTableElement = this.summaryTableRef.current.cloneNode(true);
    summaryTableElement.style.marginTop = "16px";
    summaryTableElement.querySelectorAll("img").forEach((imageElement) => {
      const altText = imageElement.getAttribute("alt");
      if (!altText) return true;
      const span = document.createElement("span");
      span.innerText = ` (${altText}) `;
      imageElement.replaceWith(span);
    });
    summaryElement.appendChild(summaryTableElement);
    const printOnlyContainerElement = this.printOnlyContainerRef.current;
    const printOnlyTableElement = printOnlyContainerElement
      ? printOnlyContainerElement.querySelector("table")
      : null;
    // contain only the latest responses
    const responsesTableElement = printOnlyTableElement
      ? printOnlyTableElement.cloneNode(true)
      : null;
    if (printOnlyTableElement)
      summaryElement.appendChild(responsesTableElement);
    const objStyles = {
      width: "1000px",
      padding: "16px",
      backgroundColor: "#FFF",
    };
    for (const prop in objStyles) {
      summaryElement.style[prop] = objStyles[prop];
    }
    summaryElement.classList.add("framed-border");
    document.querySelector("body").appendChild(summaryElement);
    return summaryElement;
  }
  afterCopy() {
    document.querySelector("#tempSummaryEl").remove();
  }
  renderCopyButton(e) {
    return (
      <CopyButton
        buildElementForCopy={() => this.buildElementForCopy()}
        buttonTitle="Click to copy summary of responses"
        buttonStyle={{
          minWidth: "56px",
          marginLeft: "8px",
        }}
        afterCopy={() => this.afterCopy()}
      ></CopyButton>
    );
  }
  renderViewButton() {
    return (
      <button
        className="icon arrow"
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
        {this.state.open ? "Done Viewing" : "View All Responses"}
        <FontAwesomeIcon
          icon="chevron-right"
          title="expand/collapse"
          style={{ marginLeft: "8px" }}
        />
      </button>
    );
  }
  renderSummary(summary, columns) {
    const noResponses = !this.hasResponses(summary);
    if (noResponses)
      return <div className="no-entries">No recorded responses</div>;
    return (
      <div>
        <div ref={this.summaryContainerRef}>
          <table
            className="table responses-summary-table"
            ref={this.summaryTableRef}
          >
            {this.renderTableHeader(columns)}
            {this.renderTableBody(columns, summary)}
          </table>
          {this.rendeAccordionContent(summary)}
        </div>
        <div className="print-only" ref={this.printOnlyContainerRef}>
          {this.renderResponses(
            summary.QuestionnaireName,
            summary.ResponsesSummary,
            1
          )}
        </div>
      </div>
    );
  }
  render() {
    return this.renderSummary(this.props.surveyData, this.props.columns);
  }
}

ResponsesSummary.propTypes = {
  summary: PropTypes.object,
  columns: PropTypes.array,
};
