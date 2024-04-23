import React from "react";
import * as d3 from "d3";
import { select } from "d3-selection";
import { transition } from "d3-transition";

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

    const radiusWidth = dataPoints.radiusWidth ? dataPoints.radiusWidth : 0.55;
    const animationDuration = 100;
    const dataId = dataPoints.id ? String(dataPoints.id).toUpperCase() : "data";
    const markerType = this.props.markerType;
    if (String(markerType).includes("square")) {
      const isSquare = markerType === "square";
      const SQUARE_WIDTH = isSquare ? 3 : 5;
      const strokeWidth = isSquare ? dataPoints.strokeWidth : 2;
      const strokeFill = isSquare ? dataPoints.strokeFill : "#FFF";
      select(node)
      .selectAll(`.${markerType}`)
      .data(data.filter((item) => !item[PLACEHOLDER_IDENTIFIER]))
      .enter()
      .append("rect")
      .attr("class", markerType)
      .attr("id", (d, i) => `${markerType}_${dataId}${i}`)
      .attr("x", (d) => xScale(d[xName]))
      .attr("y", (d) => yScale(d[yName]))
      .attr("stroke", dataPoints.strokeColor)
      .attr("stroke-width", strokeWidth)
      .attr("fill", strokeFill)
      .attr("width", SQUARE_WIDTH)
      .attr("height",  SQUARE_WIDTH)
      .on("mouseover", (d, i) => {
        if (d["baseline"] || d[PLACEHOLDER_IDENTIFIER]) {
          return;
        }
        select(`#${markerType}_${dataId}${i}`)
          .attr("width",  SQUARE_WIDTH * 1.5)
          .attr("height",  SQUARE_WIDTH * 1.5)
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
          .transition()
          .duration(animationDuration)
          .attr("width",  SQUARE_WIDTH)
          .attr("height",  SQUARE_WIDTH)
        // tooltip
        d3.selectAll(`.tooltip_${dataId}${i}`).style("display", "none");
      });

    } else {
      const strokeWidth = markerType === "circle" ? dataPoints.strokeWidth : 2;
      const strokeFill = markerType === "circle" ? dataPoints.strokeFill : "#FFF";
      select(node)
      .selectAll("circle")
      .data(data.filter((item) => !item[PLACEHOLDER_IDENTIFIER]))
      .enter()
      .append("circle")
      .attr("class", "circle")
      .attr("stroke", dataPoints.strokeColor)
      .attr("stroke-width", strokeWidth)
      .attr("fill", strokeFill)
      .attr("r", radiusWidth)
      .attr("id", (d, i) => `${markerType}_${dataId}${i}`)
      .attr("cx", (d) => xScale(d[xName]))
      .attr("cy", (d) => yScale(d[yName]))
      .on("mouseover", (d, i) => {
        if (d["baseline"] || d[PLACEHOLDER_IDENTIFIER]) {
          return;
        }
        select(`#${markerType}_${dataId}${i}`)
          .attr("r", radiusWidth * 2)
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
          .transition()
          .duration(animationDuration)
          .attr("r", radiusWidth);
        // tooltip
        d3.selectAll(`.tooltip_${dataId}${i}`).style("display", "none");
      });

    }

    
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
