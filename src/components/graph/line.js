import React from "react";
import * as d3 from "d3";
import { select } from "d3-selection";
import { transition } from "d3-transition";
import {MARKER_SHAPES} from "../../config/graph_config";

class Line extends React.Component {
  constructor() {
    super();
    this.ref = React.createRef();
    this.state = {
      xName: "",
      yName: "",
      data: null,
    };
  }
  componentDidMount() {
    this.removeAll();
    this.updateChart();
  }
  componentDidUpdate(prevProps, prevState) {
    // console.log(
    //   "prev data ",
    //   prevState.data,
    //   " current data ",
    //   this.props.data
    // );
    if (prevState.data !== this.props.data) {
      this.removeAll();
      this.updateChart();
    }
  }
  removeAll() {
    const node = this.ref.current;
    let currentNode = select(node);
    currentNode.selectAll("path").remove();
    currentNode.selectAll("circle").remove();
  }
  updateChart() {
    const node = this.ref.current;
    const {
      data,
      lineGenerator,
      xName,
      yName,
      xScale,
      yScale,
      dataPoints,
      className,
      showPrintLabel,
    } = this.props;
    const PLACEHOLDER_IDENTIFIER = "placeholder";

    this.setState({
      xName: xName,
      yName: yName,
      data: data,
    });

    //  let formatDate = timeFormat(`%Y-%b-%d`);
    let currentNode = select(node)
      .append("path")
      .datum(data)
      .attr("id", this.props.lineID)
      .attr("stroke", this.props.strokeColor || "#217684")
      .attr("stroke-width", this.props.strokeWidth || 2)
      .attr("fill", "none")
      .attr("class", className)
      .attr("d", lineGenerator);
    if (this.props.dotted) {
      currentNode.style("stroke-dasharray", this.props.dotSpacing || "3, 3"); // <== This line here!!
    }

    if (!dataPoints) {
      return;
    }
    const animationDuration = 100;
    const dataId = dataPoints.id ? String(dataPoints.id).toUpperCase() : "data";
    const markerType = String(this.props.markerType).toLowerCase();
    const markerSize = this.props.markerSize ? this.props.markerSize: 10;
    let markerShape = MARKER_SHAPES[this.props.markerType];
    if (!markerShape) markerShape = d3.symbolCircle;

    const strokeWidth = dataPoints.strokeWidth || 2;
      select(node)
      .selectAll(`.${markerType}`)
      .data(data.filter((item) => !item[PLACEHOLDER_IDENTIFIER]))
      .enter()
      .append("path")
      .attr("d", d3.symbol().type(markerShape).size(markerSize))
      .attr("transform", (d) =>`translate(${xScale(d[xName])}, ${yScale(d[yName])})`)
      .attr("id", (d, i) => `${markerType}_${dataId}${i}`)
      .attr("stroke", dataPoints.strokeColor)
      .attr("stroke-width", strokeWidth)
      .attr("fill", dataPoints.strokeColor)
      .on("mouseover", (d, i) => {
        if (d["baseline"] || d[PLACEHOLDER_IDENTIFIER]) {
          return;
        }
        select(`#${markerType}_${dataId}${i}`)
          .attr("fill", "#444")
          .attr("stroke", "#444")
          .attr("stroke-width",strokeWidth*2)
          .transition()
          .duration(animationDuration);
        //tooltip
        d3.selectAll(`.tooltip_${dataId}${i}`).style("display", "block");

      })
      .on("mouseout", (d, i) => {
        if (d["baseline"] || d[PLACEHOLDER_IDENTIFIER]) {
          return;
        }
        select(`#${markerType}_${dataId}${i}`)
          .attr("fill", dataPoints.strokeColor)
          .attr("stroke", dataPoints.strokeColor)
          .attr("stroke-width", strokeWidth)
          .transition()
          .duration(animationDuration);
        // tooltip
        d3.selectAll(`.tooltip_${dataId}${i}`).style("display", "none");
      });
    
    //print label - PRINT ONLY
    if (showPrintLabel) {
      select(node)
        .selectAll(".print-title")
        .data(data.filter((item, index) => index === data.length - 1))
        .enter()
        .append("text")
        .attr("id", (d, i) => `dataPrintText_${dataId}${i}`)
        .attr("x", (d) => xScale(d[xName]) - 12)
        .attr("y", (d) => yScale(d[yName]) - 12)
        .attr("class", "print-only print-title")
        .attr("font-size", "0.7rem")
        .attr("text-anchor", "start")
        .attr("font-weight", 600)
        .text(function () {
          return dataId.replace(/_/g, " ");
        });
    }
    const t = transition().duration(1000);
    const line = select(this.props.lineID);
    line.datum(data).transition(t).attr("d", lineGenerator);
  }
  render() {
    return <g className={this.props.className} ref={this.ref} />;
  }
}

export default Line;
