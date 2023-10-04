import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { downloadSVGImage } from "../../helpers/utility";
import {
  getDisplayDateFromISOString,
  renderImageFromSVG,
} from "../../helpers/utility";

export default class BodyDiagram extends Component {
  constructor(props) {
    super(props);
    this.state = {
      summaryData: this.getSummaryData(),
      selectedDate: this.getMostRecentDate(),
      selectedIndex: 0,
      dates: this.getDates(),
    };
    this.BodyDiagramRef = React.createRef();
    this.downloadButtonRef = React.createRef();
    this.printImageRef = React.createRef();
    this.showDownloadButton = this.showDownloadButton.bind(this);
    this.hideDownloadButton = this.hideDownloadButton.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.handleNextChange = this.handleNextChange.bind(this);
    this.handlePrevChange = this.handlePrevChange.bind(this);
  }

  componentDidMount() {
    const svgElement = this.BodyDiagramRef.current;
    if (svgElement) {
      svgElement.addEventListener("load", () => {
        this.fillInParts();
        renderImageFromSVG(
          this.printImageRef.current,
          this.getSourceDocument()
        );
        this.drawAllParts();
      });
    }
  }
  handlePrevChange() {
    const prevIndex = this.state.selectedIndex - 1;
    // console.log("Prev Index ", prevIndex);
    if (prevIndex < 0) return;
    this.setState(
      {
        selectedIndex: prevIndex,
        selectedDate: this.state.dates[prevIndex],
      },
      () => this.drawAllParts()
    );
  }
  handleNextChange() {
    const nextIndex = this.state.selectedIndex + 1;
    // console.log("Next index ", nextIndex);
    if (nextIndex > this.state.dates.length - 1) return;
    this.setState(
      {
        selectedIndex: nextIndex,
        selectedDate: this.state.dates[nextIndex],
      },
      () => this.drawAllParts()
    );
  }

  handleSelectChange(e) {
    this.setState(
      {
        selectedDate: e.target.value,
        selectedIndex: this.state.dates.findIndex((d) => d === e.target.value),
      },
      () => this.drawAllParts()
    );
  }

  showDownloadButton() {
    this.downloadButtonRef.current.style.visibility = "visible";
  }
  hideDownloadButton() {
    this.downloadButtonRef.current.style.visibility = "hidden";
  }
  getAnswersFromFhirObjects(fhirObjects, description = "pain") {
    if (!fhirObjects) return null;
    let answers = null;
    fhirObjects.forEach((key) => {
      if (!answers) answers = {};
      answers[key] =
        answers[key] && answers[key].length
          ? [...answers[key], description]
          : [description];
    });
    return answers;
  }

  getDates() {
    const summaryData = this.getSummaryData();
    if (!summaryData || !summaryData.length) return [];
    return summaryData.map((item) => item.date);
  }

  getSummaryData() {
    if (!this.props.summary || !this.props.summary.length) return null;
    return this.props.summary.sort((a, b) => {
      const date1 = new Date(a);
      const date2 = new Date(b);
      return date2 - date1;
    });
  }

  getAnswerDataByDate(targetDate) {
    const selectedDate = targetDate ? targetDate : this.state.selectedDate;
    // const testData = [{
    //   back_left_posterior_neck: ["pain"],
    //   back_midline_posterior_neck: ["pain"],
    //   back_right_posterior_neck: ["pain"],
    //   back_midline_upper_back: ["pain"],
    //   back_midline_posterior_thorax: ["pain"],
    //   back_midline_lower_back: ["pain"],
    //   back_left_posterior_head: ["pain"],
    //   back_right_posterior_head: ["pain"],
    //   front_left_brow: ["severe_pain"],
    // }
    // //{"front_left_cheek":["severe_pain"]}
    const summaryData =
      this.state.summaryData && this.state.summaryData.length
        ? this.state.summaryData
        : this.getSummaryData();
    if (!summaryData || !summaryData.length) return null;
    const responses = selectedDate
      ? summaryData.find((item) => item.date === selectedDate)
      : summaryData[0];
    if (!responses) return false;
    const painLocations = responses.painLocations;
    let answers = null;
    if (painLocations && painLocations.length) {
      answers = this.getAnswersFromFhirObjects(painLocations);
    }
    const severePainLocation = responses.severePainLocation;
    if (severePainLocation && severePainLocation.length) {
      if (!answers) answers = {};
      answers = {
        ...answers,
        ...this.getAnswersFromFhirObjects(severePainLocation, "severe_pain"),
      };
    }
    return answers;
  }

  getMostRecentDate() {
    const summaryData = this.getSummaryData();
    if (!summaryData || !summaryData.length) return null;
    return summaryData[0].date;
  }

  getSourceDocument() {
    const svgElement = this.BodyDiagramRef.current;
    if (!svgElement) return null;
    if (svgElement.contentDocument) {
      return svgElement.contentDocument;
    }
    let sourceDocument = null;
    try {
      sourceDocument = svgElement.getSVGDocument();
    } catch (e) {
      console.log("getSvgDocument error ", e);
    }
    return sourceDocument;
  }
  drawAllParts() {
    this.fillInHistoryParts();
    this.fillInParts();
  }
  fillInHistoryParts() {
    const doc = this.getSourceDocument();
    if (!doc) return;
    if (!this.state.dates.length) return;
    doc.querySelectorAll("svg path").forEach((node) => {
      node.classList.remove("prev_location");
    });
    const startIndex = this.state.selectedIndex + 1;
    if (startIndex > this.state.dates.length - 1) return;
    for (let index = startIndex; index < this.state.dates.length; index++) {
      this.fillInParts(this.state.dates[index], "prev_location");
    }
  }
  fillInParts(targetDate, className) {
    const doc = this.getSourceDocument();
    if (!doc) return;
    const answers = this.getAnswerDataByDate(targetDate);
    if (!answers) return;
    doc.querySelectorAll("svg path").forEach((node) => {
      node.classList.remove("pain");
      node.classList.remove("severe_pain");
    });
    for (let body_part_path in answers) {
      // Check that prop is not inherited
      if (answers.hasOwnProperty(body_part_path)) {
        let bodyPath = doc.getElementById(body_part_path);
        if (bodyPath) {
          // Add each class to element
          for (var i = 0; i < answers[body_part_path].length; i++) {
            let classAdd = className ? className : answers[body_part_path][i];
            bodyPath.classList.add(classAdd);
          }
        }
      }
    }
  }
  renderDateSelector() {
    const summaryData = this.state.summaryData;
    if (!summaryData || !summaryData.length) return null;
    if (summaryData.length === 1)
      return (
        <div className="text-small">
          {getDisplayDateFromISOString(summaryData[0].date)}
        </div>
      );
    const dates = summaryData.map((item) => {
      return {
        key: getDisplayDateFromISOString(item.date),
        value: item.date,
      };
    });
    return (
      <div className="select print-hidden">
        <select
          value={this.state.selectedDate}
          onChange={this.handleSelectChange}
          onBlur={this.handleSelectChange}
        >
          {dates.map((date, index) => (
            <option value={date.value} key={`bd_date_option_${index}`}>
              {date.key}
            </option>
          ))}
        </select>
      </div>
    );
  }
  renderLegend() {
    const iconStyle = {
      width: 12,
      height: 12,
      border: "1px solid",
    };
    const WORST_PAIN_COLOR = "red";
    const OTHER_LOCATION_COLOR = "yellow";
    const PREV_LOCATION_COLOR = "#e9e7e7";
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 6,
          fontSize: "0.8rem",
        }}
        className="print-hidden"
      >
        <div className="flex">
          <div
            style={{
              ...iconStyle,
              background: WORST_PAIN_COLOR,
            }}
          ></div>
          <div>Worst Pain</div>
        </div>
        <div className="flex">
          <div
            style={{
              ...iconStyle,
              background: OTHER_LOCATION_COLOR,
            }}
          ></div>
          <div>Other Locations</div>
        </div>
        {this.state.dates.length > 1 && (
          <div className="flex">
            <div
              style={{
                ...iconStyle,
                background: PREV_LOCATION_COLOR,
              }}
            ></div>
            <div>Previous Reported Locations</div>
          </div>
        )}
      </div>
    );
  }
  renderPrintOnlyLabel() {
    // print only label
    return (
      <h4 className="print-only">
        Pain locations reported on:{" "}
        {getDisplayDateFromISOString(this.getMostRecentDate())}
      </h4>
    );
  }
  renderPrintOnlyImage() {
    return (
      <img
        ref={this.printImageRef}
        alt="for print"
        className="print-image absolute"
      ></img>
    );
  }
  renderDownloadButton() {
    return (
      <button
        ref={this.downloadButtonRef}
        onClick={(e) =>
          downloadSVGImage(e, this.getSourceDocument(), null, "body_diagram")
        }
        className="print-hidden button-default rounded"
        style={{
          fontSize: "0.9rem",
          visibility: "hidden",
          color: "#777",
          minWidth: "64px",
        }}
        title="download body diagram image"
      >
        <FontAwesomeIcon
          icon="download"
          title="Download body diagram"
        ></FontAwesomeIcon>{" "}
      </button>
    );
  }
  renderNavButtons() {
    const iconStyle = {
      borderWidth: "1px",
      borderStyle: "solid",
      padding: "8px",
      width: "20px",
      height: "20px",
      borderRadius: "100vmax",
      cursor: "pointer",
      position: "relative",
      zIndex: 10,
    };
    return (
      <div className="flex flex-gap-1 icons-container" style={{ gap: "12px" }}>
        <FontAwesomeIcon
          icon="chevron-left"
          title="Previous"
          style={iconStyle}
          onClick={this.handlePrevChange}
          className={this.state.selectedIndex <= 0 ? "disabled" : ""}
        ></FontAwesomeIcon>
        <FontAwesomeIcon
          icon="chevron-right"
          title="Next"
          style={iconStyle}
          onClick={this.handleNextChange}
          className={
            this.state.selectedIndex >= this.state.dates.length - 1
              ? "disabled"
              : ""
          }
        ></FontAwesomeIcon>
      </div>
    );
  }
  render() {
    if (!this.state.summaryData || !this.state.summaryData.length) return null;
    console.log("body diagram data: ", this.getSummaryData());

    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingLeft: "4px",
          paddingRight: "4px",
        }}
        onMouseEnter={this.showDownloadButton}
        onMouseLeave={this.hideDownloadButton}
      >
        <div className="flex" style={{ marginTop: 8, marginBottom: 24 }}>
          {this.renderLegend()}
          {this.renderDateSelector()}
          {this.renderPrintOnlyLabel()}
        </div>
        <div className="flex flex-center flex-column">
          <object
            data={`${process.env.PUBLIC_URL}/assets/images/body_diagram_horizontal.svg`}
            type="image/svg+xml"
            alt="Body diagram"
            ref={this.BodyDiagramRef}
            className="diagram-container print-hidden"
          >
            Body diagram
          </object>
          {this.renderNavButtons()}
        </div>
        {this.renderPrintOnlyImage()}
        {this.state.dates.length > 1 && this.renderDownloadButton()}
      </div>
    );
  }
}

BodyDiagram.propTypes = {
  summary: PropTypes.array,
};
