import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CopyButton from "../../CopyButton";
import {
  downloadDomImage,
  getDisplayDateFromISOString,
  renderImageFromSVG,
  toDate,
} from "../../../helpers/utility";

export default class BodyDiagram extends Component {
  constructor(props) {
    super(props);
    this.state = {
      summaryData: this.getPropSummaryData(),
      selectedDate: this.getMostRecentDate(),
      selectedIndex: 0,
      dates: this.getPropDates() ?? [],
    };
    // refs
    this.containerRef = React.createRef();
    this.bodyDiagramRef = React.createRef();
    this.utilButtonsContainerRef = React.createRef();
    this.printImageRef = React.createRef();
    this.datesSelectorRef = React.createRef();
    this.toolbarRef = React.createRef();

    // event methods
    this.showUtilButtons = this.showUtilButtons.bind(this);
    this.hideUtilButtons = this.hideUtilButtons.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.handleClickNextButton = this.handleClickNextButton.bind(this);
    this.handleClickPrevButton = this.handleClickPrevButton.bind(this);
    this.handleSetFirst = this.handleSetFirst.bind(this);
    this.handleSetLast = this.handleSetLast.bind(this);

    this.SELECTED_ANIMATION_DURATION = 1000; // animation duration for indicating an option has been selected
  }

  componentDidMount() {
    this.initLoadEvent();
  }
  initLoadEvent() {
    const svgElement = this.bodyDiagramRef.current;
    if (!svgElement) return;
    svgElement.addEventListener("load", () => {
      this.fillInAnsweredParts();
      // render image for printing
      renderImageFromSVG(this.printImageRef.current, this.getSourceDocument());
      this.drawAllParts();
    });
  }
  getToolbarHeight() {
    if (!this.toolbarRef.current) return 0;
    return this.toolbarRef.current.offsetHeight;
  }
  getSelectedClass() {
    return "select-selected";
  }
  addSelectedClass() {
    if (!this.datesSelectorRef.current) return;
    this.datesSelectorRef.current
      .querySelector("select")
      .classList.add(this.getSelectedClass());
  }
  removeSelectedClass() {
    if (!this.datesSelectorRef.current) return;
    this.datesSelectorRef.current
      .querySelector("select")
      .classList.remove(this.getSelectedClass());
  }
  handleSetFirst() {
    if (this.state.selectedIndex === 0) return;
    this.addSelectedClass();
    this.setState(
      {
        selectedIndex: 0,
        selectedDate: this.state.dates[0],
      },
      () => {
        this.drawAllParts();
        setTimeout(
          () => this.removeSelectedClass(),
          this.SELECTED_ANIMATION_DURATION
        );
      }
    );
  }
  handleSetLast() {
    const lastIndex = this.state.dates.length - 1;
    if (this.state.selectedIndex === lastIndex) return;
    this.addSelectedClass();
    this.setState(
      {
        selectedIndex: lastIndex,
        selectedDate: this.state.dates[lastIndex],
      },
      () => {
        this.drawAllParts();
        setTimeout(
          () => this.removeSelectedClass(),
          this.SELECTED_ANIMATION_DURATION
        );
      }
    );
  }
  handleClickPrevButton() {
    const prevIndex = this.state.selectedIndex - 1;
    // console.log("Prev Index ", prevIndex);
    if (prevIndex < 0) return;
    this.addSelectedClass();
    this.setState(
      {
        selectedIndex: prevIndex,
        selectedDate: this.state.dates[prevIndex],
      },
      () => {
        this.drawAllParts();
        setTimeout(
          () => this.removeSelectedClass(),
          this.SELECTED_ANIMATION_DURATION
        );
      }
    );
  }
  handleClickNextButton() {
    const nextIndex = this.state.selectedIndex + 1;
    // console.log("Next index ", nextIndex);
    if (nextIndex > this.state.dates.length - 1) return;
    this.addSelectedClass();
    this.setState(
      {
        selectedIndex: nextIndex,
        selectedDate: this.state.dates[nextIndex],
      },
      () => {
        this.drawAllParts();
        setTimeout(() => {
          this.removeSelectedClass();
        }, this.SELECTED_ANIMATION_DURATION);
      }
    );
  }

  handleSelectChange(e) {
    this.setState(
      {
        selectedDate: e.target.value,
        selectedIndex: this.state.dates.findIndex((d) => d === e.target.value),
      },
      () => {
        this.drawAllParts();
      }
    );
  }

  showUtilButtons() {
    if (!this.utilButtonsContainerRef.current) return;
    this.utilButtonsContainerRef.current.style.visibility = "visible";
  }
  hideUtilButtons() {
    if (!this.utilButtonsContainerRef.current) return;
    this.utilButtonsContainerRef.current.style.visibility = "hidden";
  }
  getAnswersFromPainLocationFhirObjects(fhirObjects, description = "pain") {
    if (!fhirObjects || !Array.isArray(fhirObjects) || !fhirObjects.length)
      return null;
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

  getPropDates() {
    const summaryData = this.getPropSummaryData() ?? [];
    return summaryData.map((item) => item.date);
  }

  hasSummaryData() {
    const summaryData = this.getSummaryData();
    return summaryData && Array.isArray(summaryData) && summaryData.length > 0;
  }

  getSummaryData() {
    return this.getStateSummaryData() ?? this.getPropSummaryData();
  }

  getPropSummaryData() {
    if (
      !this.props.summary ||
      !Array.isArray(this.props.summary) ||
      !this.props.summary.length
    )
      return null;
    return this.props.summary.sort((a, b) => {
      const date1 = toDate(a.date);
      const date2 = toDate(b.date);
      return date2 - date1;
    });
  }

  getStateSummaryData() {
    if (
      !this.state.summaryData ||
      !Array.isArray(this.state.summaryData) ||
      !this.state.summaryData.length
    )
      return null;
    return this.state.summaryData;
  }

  getAnswerDataByDate(targetDate = this.state.selectedDate) {
    if (!this.hasSummaryData()) return null;
    const selectedDate = targetDate;
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
    const summaryData = this.getSummaryData();
    const responses = selectedDate
      ? summaryData.find((item) => item.date === selectedDate)
      : summaryData[0];
    if (!responses) return false;
    const painLocations = responses.painLocations;
    const severePainLocation = responses.severePainLocation;
    return {
      ...(this.getAnswersFromPainLocationFhirObjects(painLocations) || {}),
      ...(this.getAnswersFromPainLocationFhirObjects(
        severePainLocation,
        "severe_pain"
      ) || {}),
    };
  }

  getMostRecentDate() {
    const summaryData = this.getPropSummaryData();
    if (!summaryData.length) return null;
    return summaryData[0].date;
  }

  getSourceDocument() {
    const svgElement = this.bodyDiagramRef.current;
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
    this.fillInAnsweredParts();
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
      this.fillInAnsweredParts(this.state.dates[index], "prev_location");
    }
  }
  fillInAnsweredParts(targetDate, className) {
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
    if (!this.hasSummaryData()) return null;
    const summaryData = this.getSummaryData();
    const arrObjDates = summaryData.map((item) => {
      return {
        key: getDisplayDateFromISOString(item.date),
        value: item.date,
      };
    });
    return (
      <div
        className={`select print-hidden ${
          summaryData.length === 1 ? "disable-select" : ""
        }`}
        ref={this.datesSelectorRef}
      >
        <select
          value={this.state.selectedDate}
          onChange={this.handleSelectChange}
          onBlur={this.handleSelectChange}
        >
          {arrObjDates.map((date, index) => (
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
    const legendContainerStyle = {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 6,
      fontSize: "0.8rem",
      position: "relative",
      top: "4px",
      left: "4px",
    };
    return (
      <div
        style={legendContainerStyle}
        className="print-hidden legend-wrapper part-of-bd"
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
            <div>Previously Reported Locations</div>
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
        className="exclude-from-copy body-diagram print-image absolute"
      ></img>
    );
  }
  renderDownloadButton() {
    let params = this.copyImageOptions;
    params.beforeDownload = () => this.beforeCopy();
    params.afterDownload = () => this.afterCopy();
    return (
      <button
        onClick={(e) => {
          downloadDomImage(
            e,
            this.containerRef.current,
            `body_diagram_${this.state.selectedDate}`,
            this.copyImageOptions
          );
        }}
        className="print-hidden button-default button-secondary rounded"
        title="download body diagram image"
      >
        <FontAwesomeIcon
          icon="download"
          title="Download body diagram"
        ></FontAwesomeIcon>
      </button>
    );
  }
  beforeCopy() {
    let cloneSvgElement = this.getSourceDocument()
      .querySelector("svg")
      .cloneNode(true);
    const styles = {
      position: "absolute",
      top: "0",
      transform: `translate(-50%, ${this.getToolbarHeight() + 36}px)`,
    };
    cloneSvgElement.setAttribute("id", "temp_bd");
    cloneSvgElement.classList.add("part-of-bd");
    Object.assign(cloneSvgElement.style, styles);
    this.containerRef.current.append(cloneSvgElement);
    if (this.bodyDiagramRef.current) {
      this.bodyDiagramRef.current.style.visibility = "hidden";
    }
    if (this.datesSelectorRef.current)
      this.datesSelectorRef.current.classList.add("read-only");
  }
  afterCopy() {
    let tempBodyDiagramElement = document.querySelector("#temp_bd");
    if (tempBodyDiagramElement) {
      this.containerRef.current.removeChild(tempBodyDiagramElement);
    }
    if (this.bodyDiagramRef.current) {
      this.bodyDiagramRef.current.style.visibility = "visible";
    }
    if (this.datesSelectorRef.current)
      this.datesSelectorRef.current.classList.remove("read-only");
  }
  renderCopyButton() {
    return (
      <CopyButton
        buttonTitle="Click to copy body diagram"
        elementToCopy={this.containerRef.current}
        beforeCopy={() => this.beforeCopy()}
        afterCopy={() => this.afterCopy()}
      ></CopyButton>
    );
  }
  renderUtilButtons() {
    return (
      <div
        className="exclude-from-copy buttons-container"
        style={{ position: "absolute", right: 0, top: "-24px" }}
      >
        <div
          className="flex flex-gap-1 flex-start"
          ref={this.utilButtonsContainerRef}
        >
          {this.renderCopyButton()}
          {/* {this.renderDownloadButton()} */}
        </div>
      </div>
    );
  }
  shouldRenderNav() {
    if (
      !this.state.dates ||
      !this.state.dates.length ||
      this.state.dates.length < 2
    )
      return false;
    return true;
  }
  renderNavButtons() {
    if (!this.shouldRenderNav()) return null;
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
      <div className="flex flex-gap-1 icons-container exclude-from-copy">
        <FontAwesomeIcon
          icon="angle-double-left"
          title="First"
          style={iconStyle}
          onClick={this.handleSetFirst}
          className={this.state.selectedIndex <= 0 ? "disabled" : ""}
        ></FontAwesomeIcon>
        <FontAwesomeIcon
          icon="chevron-left"
          title="Previous"
          style={iconStyle}
          onClick={this.handleClickPrevButton}
          className={this.state.selectedIndex <= 0 ? "disabled" : ""}
        ></FontAwesomeIcon>
        <FontAwesomeIcon
          icon="chevron-right"
          title="Next"
          style={iconStyle}
          onClick={this.handleClickNextButton}
          className={
            this.state.selectedIndex >= this.state.dates.length - 1
              ? "disabled"
              : ""
          }
        ></FontAwesomeIcon>
        <FontAwesomeIcon
          icon="angle-double-right"
          title="Last"
          style={iconStyle}
          onClick={this.handleSetLast}
          className={
            this.state.selectedIndex >= this.state.dates.length - 1
              ? "disabled"
              : ""
          }
        ></FontAwesomeIcon>
      </div>
    );
  }
  renderDots() {
    if (!this.shouldRenderNav()) return null;
    if (!this.hasSummaryData()) return null;
    const summaryData = this.getSummaryData();
    return (
      <div className="exclude-from-copy dots-container print-hidden">
        {summaryData.map((item, index) => {
          return (
            <div
              className={`dot ${
                index === this.state.selectedIndex ? "active" : ""
              }`}
              key={`dot_${index}`}
              title={`${getDisplayDateFromISOString(item.date)}`}
            ></div>
          );
        })}
      </div>
    );
  }
  render() {
    if (!this.hasSummaryData()) return null;
    const parentContainerStyle = {
      width: "calc(100% - 24px)",
    };
    const mainContainerStyle = {
      backgroundColor: "#FFF",
      width: "100%",
      position: "relative",
      padding: "4px 4px 12px",
      border: "1px solid transparent",
    };
    const toolbarContainerStyle = {
      marginTop: 8,
      marginBottom: 24,
      alignItems: "flex-start",
    };
    return (
      <div style={parentContainerStyle}>
        <div ref={this.containerRef} style={mainContainerStyle}>
          <div
            className="flex"
            style={toolbarContainerStyle}
            ref={this.toolbarRef}
          >
            {this.renderLegend()}
            {this.renderDateSelector()}
            {this.renderPrintOnlyLabel()}
          </div>
          <div
            className="flex flex-center flex-column"
            style={{ position: "relative" }}
          >
            {this.state.dates.length >= 1 && this.renderUtilButtons()}
            <object
              data={`${process.env.PUBLIC_URL}/assets/images/body_diagram_horizontal.svg`}
              type="image/svg+xml"
              alt="Body diagram"
              ref={this.bodyDiagramRef}
              className="exclude-from-copy diagram-container print-hidden"
            >
              Body diagram
            </object>
          </div>
          {this.renderPrintOnlyImage()}
        </div>
        <div className="flex flex-center flex-column" style={{backgroundColor: "#FFF"}}>
          {this.renderNavButtons()}
          {this.renderDots()}
        </div>
      </div>
    );
  }
}

BodyDiagram.propTypes = {
  summary: PropTypes.array,
};
