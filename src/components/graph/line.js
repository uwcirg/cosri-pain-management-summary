import React from "react";
import * as d3 from "d3";
import { select } from "d3-selection";
import { timeFormat } from "d3-time-format";
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
    currentNode.selectAll("rect").remove();
    currentNode.selectAll("text").remove();
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
      showDataIdInLabel,
      toolTipElementId,
      toolTipOffsetX,
      toolTipOffsetY,
    } = this.props;
    const PLACEHOLDER_IDENTIFIER = "placeholder";

    this.setState({
      xName: xName,
      yName: yName,
      data: data,
    });

    let formatDate = timeFormat(`%Y-%b-%d`);
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

    let toolTipElement = toolTipElementId
      ? select(`${toolTipElementId}`)
      : null;
  
    select(node)
      .selectAll("circle")
      .data(data.filter((item) => !item[PLACEHOLDER_IDENTIFIER]))
      .enter()
      .append("circle")
      .attr("class", "circle")
      .attr("stroke", dataPoints.strokeColor)
      .attr("stroke-width", dataPoints.strokeWidth)
      .attr("fill", dataPoints.strokeFill)
      .attr("r", radiusWidth)
      .attr("id", (d, i) => `circle_${dataId}${i}`)
      .attr("cx", (d) => xScale(d[xName]))
      .attr("cy", (d) => yScale(d[yName]))
      .on("mouseover", (d, i) => {
        if (d["baseline"] || d[PLACEHOLDER_IDENTIFIER]) {
          return;
        }
        select(`#circle_${dataId}${i}`)
          .attr("r", radiusWidth * 2)
          .transition()
          .duration(animationDuration)

        if (toolTipElement) {
          toolTipElement
            .html(
              `${showDataIdInLabel ? dataId.toUpperCase() + "<br/>" : ""}
              ${d[yName]}<br/>${formatDate(d[xName])}`
            )

            .style("left", d3.event.pageX - toolTipOffsetX + "px")
            .style("top", d3.event.pageY - toolTipOffsetY + "px");
          //Makes the tooltip element appear on hover:
          toolTipElement.transition().duration(50).style("opacity", 1);
        } else {
          select(`#dataRect_${dataId}${i}`).style("display", "block");
          select(`#dataText_${dataId}${i}`).style("display", "block");
        }
      })
      .on("mouseout", (d, i) => {
        if (d["baseline"] || d[PLACEHOLDER_IDENTIFIER]) {
          return;
        }
        select(`#circle_${dataId}${i}`)
          .transition()
          .duration(animationDuration)
          .attr("r", radiusWidth);

        //Makes the tooltip element disappear:
        if (toolTipElement) {
          toolTipElement.transition().duration("50").style("opacity", 0);
        } else {
          select(`#dataRect_${dataId}${i}`).style("display", "none");
          select(`#dataText_${dataId}${i}`).style("display", "none");
        }
      });

    //rect
    select(node)
      .selectAll(".rect-tooltip")
      .data(data.filter((item) => !item[PLACEHOLDER_IDENTIFIER]))
      .enter()
      .append("rect")
      .attr("class", "rect-tooltip")
      .attr("id", (d, i) => `dataRect_${dataId}${i}`)
      .attr("x", (d) => xScale(d[xName]) - 52)
      .attr("y", (d) => yScale(d[yName]) + 12)
      .attr("width", (d) => `${formatDate(d[xName])}, ${d[yName]}`.length * 6)
      .attr("height", 20)
      .style("display", "none")
      .style("stroke", "black")
      .style("stroke-width", "0.25")
      .style("fill", "#FFF");

    //tooltip
    select(node)
      .selectAll("text")
      .data(data.filter((item) => !item[PLACEHOLDER_IDENTIFIER]))
      .enter()
      .append("text")
      .attr("id", (d, i) => `dataText_${dataId}${i}`)
      .attr("x", (d) => xScale(d[xName]) - 48)
      .attr("y", (d) => yScale(d[yName]) + 26)
      .style("display", "none")
      .attr("font-size", "0.7rem")
      .attr("text-anchor", "start")
      .attr("font-weight", 600)
      .text(function (d) {
        return `${formatDate(d[xName])}, ${d[yName]}`;
      });

    //print label - PRINT ONLY
    if (showPrintLabel) {
      select(node)
        .selectAll(".text")
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
