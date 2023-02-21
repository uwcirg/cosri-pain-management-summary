import React from 'react';
import { select } from 'd3-selection';
import {timeFormat} from "d3-time-format";
import { transition } from 'd3-transition';


class Line extends React.Component {
  constructor() {
    super();
    this.ref = React.createRef();
    this.state = {
      xName: "",
      yName: ""
    }
  }
  componentDidMount() {
    const node = this.ref.current;
    const { data, lineGenerator, xName, yName, xScale, yScale, dataPoints } = this.props;
    const PLACEHOLDER_IDENTIFIER = "placeholder";

    this.setState({
      xName: xName,
      yName: yName
    });

    let formatDate = timeFormat(`%Y-%b-%d`);
    let currentNode = select(node)
      .append('path')
      .datum(data)
      .attr('id', this.props.lineID)
      .attr('stroke', this.props.strokeColor || "#217684")
      .attr('stroke-width', this.props.strokeWidth || 2)
      .attr('fill', 'none')
      .attr('d', lineGenerator);
    if (this.props.dotted) {
      currentNode.style("stroke-dasharray", (this.props.dotSpacing || "3, 3"))  // <== This line here!!
    }

    if (dataPoints) {
      const radiusWidth = dataPoints.radiusWidth
        ? dataPoints.radiusWidth
        : 0.55;
      const expandedRadiusWidth = radiusWidth * 4;
      const animationDuration = 100;
      const dataId = dataPoints.id ? dataPoints.id : "data";
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
          select(`#dataText_${dataId}${i}`).attr("class", "show");
          select(`#dataRect_${dataId}${i}`).attr("class", "show");
        })
        .on("mouseout", (d, i) => {
          if (d["baseline"] || d[PLACEHOLDER_IDENTIFIER]) {
            return;
          }
          select(`#circle_${dataId}${i}`)
            .transition()
            .duration(animationDuration)
            .attr("r", radiusWidth);
          select(`#dataText_${dataId}${i}`).attr("class", "hide");
          select(`#dataRect_${dataId}${i}`).attr("class", "hide");
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
        .attr("class", "hide")
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
        .attr("class", "hide")
        .attr("font-size", 11)
        .attr("text-anchor", "start")
        .attr("font-weight", 600)
        .text(function (d) {
          return `${formatDate(d[xName])}, ${d[yName]}`;
        });
    }
    this.updateChart();
  }
  componentDidUpdate() {
    this.updateChart();
  }
  updateChart() {
    const {
          lineGenerator, data,
        } = this.props;

    const t = transition().duration(1000);

    const line = select(this.props.lineID);

    line
      .datum(data)
      .transition(t)
      .attr('d', lineGenerator);

  }
  render() {
    return <g className={this.props.className} ref={this.ref} />;
  }
}

export default Line;
