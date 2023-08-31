import React from "react";
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
    };
  }
  componentDidMount() {
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

    if (dataPoints) {
      const radiusWidth = dataPoints.radiusWidth
        ? dataPoints.radiusWidth
        : 0.55;
      const expandedRadiusWidth = radiusWidth * 4;
      const animationDuration = 100;
      const dataId = dataPoints.id ? String(dataPoints.id).toUpperCase() : "data";
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
            .transition()
            .duration(animationDuration)
            .attr("r", expandedRadiusWidth);
          select(`#dataText_${dataId}${i}`).style("display", "block");
          select(`#dataRect_${dataId}${i}`).style("display", "block");
        })
        .on("mouseout", (d, i) => {
          if (d["baseline"] || d[PLACEHOLDER_IDENTIFIER]) {
            return;
          }
          select(`#circle_${dataId}${i}`)
            .transition()
            .duration(animationDuration)
            .attr("r", radiusWidth);
          select(`#dataText_${dataId}${i}`).style("display", "none");
          select(`#dataRect_${dataId}${i}`).style("display", "none");
        });

      //rect
      select(node)
        .selectAll(".rect-tooltip")
        .data(data.filter((item) => !item[PLACEHOLDER_IDENTIFIER]))
        .enter()
        .append("rect")
        .attr("class", "rect-tooltip")
        .attr("id", (d, i) => `dataRect_${dataId}${i}`)
        .attr("x", (d) => xScale(d[xName]) - 44)
        .attr("y", (d) => yScale(d[yName]) + 12)
        .attr("width", (d) => `${formatDate(d[xName])}, ${d[yName]}`.length * 6)
        .attr("height", 26)
        .style("display", "none")
        .style("stroke", "#777")
        .style("stroke-width", "0.5")
        .style("rx", 4)
        .style("fill", "white");

      //tooltip
      select(node)
        .selectAll("text")
        .data(data.filter((item) => !item[PLACEHOLDER_IDENTIFIER]))
        .enter()
        .append("text")
        .attr("id", (d, i) => `dataText_${dataId}${i}`)
        .attr("x", (d) => xScale(d[xName]) - 36)
        .attr("y", (d) => yScale(d[yName]) + 30)
        .style("display", "none")
        .attr("font-size", 10)
        .attr("text-anchor", "start")
        .attr("font-weight", 600)
        .text(function (d) {
          return `${formatDate(d[xName])}, ${d[yName]}`;
        });

      //print label - PRINT ONLY
      if (showPrintLabel) {
        select(node)
          .selectAll(".text")
          .data(data.filter((item, index) => index === (data.length-1)))
          .enter()
          .append("text")
          .attr("id", (d, i) => `dataLabelText_${dataId}${i}`)
          .attr("x", (d) => xScale(d[xName]) - 6)
          .attr("y", (d) => yScale(d[yName]) - 12)
          .attr("class", "print-only print-title")
          .attr("font-size", 11)
          .attr("text-anchor", "start")
          .attr("font-weight", 600)
          .text(function () {
            return dataId.replace(/_/g, " ");
          });
      }
    }
    this.updateChart();
  }
  componentDidUpdate() {
    this.updateChart();
  }
  updateChart() {
    const { lineGenerator, data } = this.props;

    const t = transition().duration(1000);

    const line = select(this.props.lineID);

    line.datum(data).transition(t).attr("d", lineGenerator);
  }
  render() {
    return <g className={this.props.className} ref={this.ref} />;
  }
}

export default Line;
