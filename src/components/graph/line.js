import React from "react";
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
      dataPointsProps,
      className,
      showPrintLabel,
    } = this.props;

    this.setState({
      xName: xName,
      yName: yName,
      data: data,
    });

    //  let formatDate = timeFormat(`%Y-%b-%d`);
    // line
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
      currentNode.style("stroke-dasharray", this.props.dotSpacing || "3, 3")
       
    }
    const dataId =
      dataPointsProps && dataPointsProps.id
        ? String(dataPointsProps.id).toUpperCase()
        : "data";
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
