import React, { Component } from "react";
import PropTypes from "prop-types";

export default class BodyDiagram extends Component {
  constructor(props) {
    super(props);
    this.BodyDiagramRef = React.createRef();
  }
  componentDidMount() {
    const svgElement = this.BodyDiagramRef.current;
    svgElement.addEventListener("load", () => this.fillInParts());
  }

  getData() {
    const testData = {
      back_left_posterior_neck: ["pain"],
      back_midline_posterior_neck: ["pain"],
      back_right_posterior_neck: ["pain"],
      back_midline_upper_back: ["pain"],
      back_midline_posterior_thorax: ["pain"],
      back_midline_lower_back: ["pain"],
      back_left_posterior_head: ["pain"],
      back_right_posterior_head: ["pain"],
      front_left_brow: ["severe_pain"],
    };
    //{"front_left_cheek":["severe_pain"]}
    return this.props.answers ? this.props.answers : testData;
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
    for (var body_part_path in answers) {
      // Check that prop is not inherited
      if (answers.hasOwnProperty(body_part_path)) {
        // Add each class to element
        for (var i = 0; i < answers[body_part_path].length; i++)
          var classAdd = answers[body_part_path][i];
        var bodyPath = doc.getElementById(body_part_path);
        // console.log("bodyPath? ", bodyPath, " classAdd ", classAdd)
        if (bodyPath) {
          bodyPath.classList.add(classAdd);
        }
      }
    }
  }
  render() {
    if (!this.getData()) return false;
    return (
      <object
        data={`${process.env.PUBLIC_URL}/assets/images/body_diagram_horizontal.svg`}
        type="image/svg+xml"
        alt="Body diagram"
        ref={this.BodyDiagramRef}
      >
        Body diagram
      </object>
    );
  }
}

BodyDiagram.propTypes = {
  answers: PropTypes.object,
};