import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { downloadSVGImage } from "../../helpers/utility";

export default class BodyDiagram extends Component {
  constructor(props) {
    super(props);
    this.BodyDiagramRef = React.createRef();
    this.downloadButtonRef = React.createRef();
    this.showDownloadButton = this.showDownloadButton.bind(this);
    this.hideDownloadButton = this.hideDownloadButton.bind(this);
  }
  componentDidMount() {
    const svgElement = this.BodyDiagramRef.current;
    svgElement.addEventListener("load", () => this.fillInParts());
  }

  showDownloadButton() {
    this.downloadButtonRef.current.style.visibility = "visible";
  }
  hideDownloadButton() {
    console.log("WTF Shouid hide this no?")
    this.downloadButtonRef.current.style.visibility = "hidden";
  }

  getData() {
    // const testData = {
    //   back_left_posterior_neck: ["pain"],
    //   back_midline_posterior_neck: ["pain"],
    //   back_right_posterior_neck: ["pain"],
    //   back_midline_upper_back: ["pain"],
    //   back_midline_posterior_thorax: ["pain"],
    //   back_midline_lower_back: ["pain"],
    //   back_left_posterior_head: ["pain"],
    //   back_right_posterior_head: ["pain"],
    //   front_left_brow: ["severe_pain"],
    // };
    // //{"front_left_cheek":["severe_pain"]}
    return this.props.answers ? this.props.answers : null;
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
  fillInParts() {
    const doc = this.getSourceDocument();
    if (!doc) return;
    const answers = this.getData();
    if (!answers) return;
    for (let body_part_path in answers) {
      // Check that prop is not inherited
      if (answers.hasOwnProperty(body_part_path)) {
        let bodyPath = doc.getElementById(body_part_path);
        if (bodyPath) {
          // Add each class to element
          for (var i = 0; i < answers[body_part_path].length; i++) {
            let classAdd = answers[body_part_path][i];
            bodyPath.classList.add(classAdd);
          }
        }
      }
    }
  }
  renderLegend() {
    const iconStyle = {
      width: 12,
      height: 12,
      border: "1px solid",
    };
    const WORST_PAIN_COLOR = "red";
    const OTHER_LOCATION_COLOR = "yellow";
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 6,
          marginTop: 8,
          marginBottom: 24,
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
      </div>
    );
  }
  render() {
    if (!this.getData()) return false;

    return (
      <div
        style={{ position: "relative" }}
        onMouseEnter={this.showDownloadButton}
        onMouseLeave={this.hideDownloadButton}
      >
        {this.renderLegend()}
        <object
          data={`${process.env.PUBLIC_URL}/assets/images/body_diagram_horizontal.svg`}
          type="image/svg+xml"
          alt="Body diagram"
          ref={this.BodyDiagramRef}
        >
          Body diagram
        </object>
        <button
          ref={this.downloadButtonRef}
          onClick={(e) =>
            downloadSVGImage(e, this.getSourceDocument(), null, "body_diagram")
          }
          className="print-hidden button-default rounded"
          style={{
            fontSize: "0.9rem",
            // uncomment to show this
            visibility: "hidden",
          }}
        >
          <FontAwesomeIcon
            icon="download"
            title="Download body diagram"
          ></FontAwesomeIcon>{" "}
          {/* <span>Download graph</span> */}
        </button>
      </div>
    );
  }
}

BodyDiagram.propTypes = {
  answers: PropTypes.object,
};
