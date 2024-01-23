import React, { Component } from "react";
//import { toBlob } from "html-to-image";
import PropTypes from "prop-types";
import ScoringSummary from "./ScoringSummary";
import BodyDiagram from "./BodyDiagram";
import SurveyGraph from "../graph/SurveyGraph";
import {
  allowCopyClipboardItem,
  writeHTMLToClipboard,
} from "../../helpers/utility";

export default class Overview extends Component {
  constructor() {
    super(...arguments);
    this.summaryHTML = "";
    this.copyAllData = this.copyAllData.bind(this);
    this.SurveyGraphRef = React.createRef();
  }
  async copyAllData() {
    if (!allowCopyClipboardItem()) return null;

    const surveyGraphNode = document.querySelector(".survey-graph.print-image");
    if (surveyGraphNode) {
      console.log("graph html ", surveyGraphNode.outerHTML);
      surveyGraphNode.style.position = "relative";
      surveyGraphNode.style.zIndex = 1;
      surveyGraphNode.style.width = "500px";
      surveyGraphNode.style.display = "block";
      this.summaryHTML += surveyGraphNode.outerHTML;
    }

    const bodyDiagramGraphNode = document.querySelector(
      ".body-diagram.print-image"
    );
    if (bodyDiagramGraphNode) {
      console.log("body diagram html ", bodyDiagramGraphNode.outerHTML);
      this.summaryHTML += bodyDiagramGraphNode.outerHTML;
    }

    const summaryNode = document
      .querySelector(".report .summary__display")
      .cloneNode(true);
    summaryNode.querySelectorAll("table").forEach((node) => {
      node.style.fontFamily = "Arial, sans-serif";
      node.querySelectorAll("td").forEach((cell) => {
        cell.style.padding = "8px";
        cell.style.verticalAlign = "middle";
      });
    });
    const sections = summaryNode.querySelectorAll(".sub-section");
    const scoreSummaryNode = document
      .querySelector(".score-panel")
      .cloneNode(true);
    if (scoreSummaryNode) {
      const tableElement = scoreSummaryNode.querySelector("table");
      if (tableElement) {
        tableElement.style.fontFamily = "Ariel, sans-serif";
      }
      scoreSummaryNode.querySelectorAll("a").forEach((anchorElement) => {
        const span = document.createElement("span");
        span.innerText = anchorElement.innerText;
        anchorElement.replaceWith(span);
      });
      scoreSummaryNode.querySelectorAll("img").forEach((imageElement) => {
        const span = document.createElement("span");
        span.innerText = ` (${imageElement.getAttribute("alt")}) `;
        imageElement.replaceWith(span);
      });
      scoreSummaryNode.querySelectorAll("td, th").forEach((cellElement) => {
        cellElement.style.padding = "8px";
      });
      this.summaryHTML += scoreSummaryNode.outerHTML;
    }

    sections.forEach((section, index) => {
      const headerElement = section.querySelector(".sub-section__header__name");
      if (headerElement) {
        headerElement
          .querySelectorAll(".flag")
          .forEach((flagElement) => (flagElement.style.display = "none"));
        this.summaryHTML += "<br/><br/>";
        this.summaryHTML += headerElement.outerHTML;
      }
      const summaryElement = section.querySelector(".responses-summary-table");
      if (summaryElement) {
        this.summaryHTML += "<br/><br/>";
        summaryElement.querySelectorAll("img").forEach((imageElement) => {
          const span = document.createElement("span");
          span.innerText = `(${imageElement.getAttribute("alt")})`;
          imageElement.replaceWith(span);
        });
        summaryElement.querySelectorAll("td, th").forEach((cellElement) => {
          cellElement.style.padding = "8px";
        });
        summaryElement.querySelectorAll(".icon").forEach((iconElement) => {
          iconElement.style.display = "none";
        });
        this.summaryHTML += summaryElement.outerHTML;
      }
      const responseElement = section.querySelector(
        ".print-only .response-table"
      );
      if (responseElement) {
        this.summaryHTML += "<br/><br/>";
        this.summaryHTML += responseElement.outerHTML;
      }
      const noEntryElement = section.querySelector(".no-entries");
      if (noEntryElement) {
        this.summaryHTML += "<br/><br/>";
        this.summaryHTML += noEntryElement.outerHTML;
      }
      if (index !== sections.length - 1) {
        this.summaryHTML += "<br/><hr/><br/>";
      }
    });
    // const imageBlob = await toBlob(
    //   document.querySelector(".survey-svg-container"),
    //   {
    //     filter: (node) => {
    //       const exclusionClasses = ["exclude-from-copy"];
    //       return !exclusionClasses.some((classname) =>
    //         node.classList?.contains(classname)
    //       );
    //     },
    //   }
    // );
    // const summaryItem = {
    //   "image/png": imageBlob,
    //   "text/html": new Blob([this.summaryHTML], {
    //     type: "text/html"
    //   })
    // };
    // console.log("imaging blob ", imageBlob);
    // const imageBlob2 = await toBlob(document.querySelector(".body-diagram.print-image"), {
    //   filter: (node) => {
    //     const exclusionClasses = ["exclude-from-copy"];
    //     return !exclusionClasses.some((classname) =>
    //       node.classList?.contains(classname)
    //     );
    //   },
    // });
    // console.log("imaging blob ", imageBlob2);
    // navigator.clipboard
    //   .write([new window.ClipboardItem(summaryItem)])
    //   .then(() => alert("content copied"));
    // //body-diagram print-image
    // console.log("summary HTML ", this.summaryHTML)
    writeHTMLToClipboard(
      "<div style='font-family: Arial, sans-serif; padding: 16px;'>" +
        this.summaryHTML +
        "</div>"
    )
      .then(() => {
        alert("All content copied to clipboard");
      })
      .catch((e) => {
        alert("Error copying content to clipboard " + e);
      });
  }
  getGraphData(summaryData) {
    if (!summaryData) return [];
    let data = [];
    summaryData.forEach((item) => {
      if (!item.ResponsesSummary || !item.ResponsesSummary.length) return true;
      if (item.ReportOnce) return true;
      data = [...data, ...item.ResponsesSummary];
    });
    return data;
  }
  getBodyDiagramDataSummaryData(summaryData) {
    if (!summaryData) return null;
    const matchedData = summaryData.filter(
      (item) => String(item.dataKey).toLowerCase() === "body_diagram"
    );
    if (!matchedData.length) return null;
    if (
      !matchedData[0].ResponsesSummary ||
      !matchedData[0].ResponsesSummary.length
    )
      return null;
    return matchedData[0].ResponsesSummary;
  }
  render() {
    const { summary } = this.props;
    const dataToShow =
      summary && Array.isArray(summary)
        ? summary.filter((item) => !item.ExcludeFromScoring)
        : [];
    const graphData = this.getGraphData(dataToShow);
    const BodyDiagramData = this.getBodyDiagramDataSummaryData(summary);
    const noSummaryData =
      !summary ||
      !summary.length ||
      summary.filter(
        (item) => item.ResponsesSummary && item.ResponsesSummary.length > 0
      ).length === 0;
    const containerStyle = {
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    };
    return (
      <div className="panel-container">
        <div className="panel graph">
          <SurveyGraph data={graphData} ref={this.SurveyGraphRef}></SurveyGraph>
        </div>
        <div className={`panel ${noSummaryData ? "no-entries" : ""}`}>
          {/* JUST to test copy */}
          <div style={{ marginBottom: "16px", textAlign: "right" }}>
            {" "}
            <button
              onClick={this.copyAllData}
              className="button-primary"
              title="text only, can't seem to get images to copy at the same time.  what the hell"
            >
              Test Copy All HTML Text
            </button>
          </div>
          <div className="panel__item bordered full-width score-panel">
            <ScoringSummary
              summary={dataToShow}
              showAnchorLinks={true}
            ></ScoringSummary>
          </div>
          {BodyDiagramData && (
            <div className="panel__item bordered" style={containerStyle}>
              <BodyDiagram summary={BodyDiagramData}></BodyDiagram>
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
