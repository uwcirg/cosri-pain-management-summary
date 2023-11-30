import React from "react";
import { select } from "d3-selection";
import { timeFormat } from "d3-time-format";

class Tooltip extends React.Component {
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
    currentNode.selectAll("text").remove();
    currentNode.selectAll("rect").remove();
  }
  updateChart() {
    const node = this.ref.current;
    const {
      data,
      xName,
      yName,
      xScale,
      yScale,
      dataPoints,
      showDataIdInLabel,
    } = this.props;
    const PLACEHOLDER_IDENTIFIER = "placeholder";

    this.setState({
      xName: xName,
      yName: yName,
      data: data,
    });

    const formatDate = timeFormat(`%Y-%b-%d`);
    const dataId = dataPoints.id ? String(dataPoints.id).toUpperCase() : "data";

    //rect
    select(node)
      .selectAll(".tooltip-rect")
      .data(data.filter((item) => !item[PLACEHOLDER_IDENTIFIER]))
      .enter()
      .append("rect")
      .attr("class", (d, i) => `tooltip-rect tooltip_${dataId}${i}`)
      .attr("id", (d, i) => `dataRect_${dataId}${i}`)
      .attr("x", (d) => xScale(d[xName]) - 68)
      .attr("y", (d) => yScale(d[yName]) + 12)
      .attr("width", (d) => `${formatDate(d[xName])}, ${d[yName]}`.length * 6.3)
      .attr("height", showDataIdInLabel ? 38 : 20)
      .style("stroke", "black")
      .style("stroke-width", "0.1")
      .style("fill", "#FFF")
      .style("display", "none");

    const displayToolTipText = (xOffset, yOffset) =>
      select(node)
        .selectAll(".tooltip_text")
        .data(data.filter((item) => !item[PLACEHOLDER_IDENTIFIER]))
        .enter()
        .append("text")
        .attr("class", (d, i) => `tooltip_text tooltip_${dataId}${i}`)
        .attr("id", (d, i) => `dataText_${dataId}${i}`)
        .attr("x", (d) => xScale(d[xName]) - (xOffset ? xOffset : 62))
        .attr("y", (d) => yScale(d[yName]) + (yOffset ? yOffset : 26))
        .style("display", "none")
        .attr("font-size", "0.7rem")
        .attr("text-anchor", "start")
        .attr("font-weight", 500)
        .text(function (d) {
          return `${formatDate(d[xName])}, ${d[yName]}`;
        });
    const displayToolTipId = (xOffset, yOffset) =>
      select(node)
        .selectAll(".tooltip_text_id")
        .data(data.filter((item) => !item[PLACEHOLDER_IDENTIFIER]))
        .enter()
        .append("text")
        .attr("class", (d, i) => `tooltip_text_id tooltip_${dataId}${i}`)
        .attr("id", (d, i) => `dataText_id_${dataId}${i}`)
        .attr("x", (d) => xScale(d[xName]) - (xOffset ? xOffset : 62))
        .attr("y", (d) => yScale(d[yName]) + (yOffset ? yOffset : 26))
        .style("display", "none")
        .attr("font-size", "0.7rem")
        .attr("text-anchor", "start")
        .attr("font-weight", 500)
        .text(function (d) {
          return dataId.toUpperCase();
        });
    if (showDataIdInLabel) {
      //tooltip
      displayToolTipId();
      displayToolTipText(62, 44);
    } else {
      //tooltip
      displayToolTipText();
    }
  }
  render() {
    return <g className={this.props.className} ref={this.ref} />;
  }
}

export default Tooltip;
