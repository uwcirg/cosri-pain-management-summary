import React from "react";
import * as d3 from "d3";
import { select } from "d3-selection";
// import { transition } from "d3-transition";
import { MARKER_SHAPES } from "../../config/graph_config";

class Markers extends React.Component {
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
      xName,
      yName,
      xScale,
      yScale,
      dataPointsProps,
    } = this.props;
    const PLACEHOLDER_IDENTIFIER = "placeholder";
    const BASELINE_IDENTIFIER = "baseline";
    const isExcludeItem = (item) => !item[yName] || item[BASELINE_IDENTIFIER] || item[PLACEHOLDER_IDENTIFIER];

    this.setState({
      xName: xName,
      yName: yName,
      data: data,
    });

    if (!dataPointsProps) {
      return null;
    }
    const animationDuration = 100;
    const dataId = dataPointsProps.id ? String(dataPointsProps.id).toUpperCase() : "data";
    const markerType = this.props.markerType ? String(this.props.markerType).toLowerCase() : "circle";
    const markerSize = this.props.markerSize ? this.props.markerSize : 10;
    let markerShape = MARKER_SHAPES[this.props.markerType];
    if (!markerShape) markerShape = d3.symbolCircle;

    const strokeWidth = dataPointsProps.strokeWidth || 2;
    select(node)
      .selectAll(`.${markerType}`)
      .data(data.filter((item) => !isExcludeItem(item)))
      .enter()
      .append("path")
      .attr("d", d3.symbol().type(markerShape).size(markerSize))
      .attr(
        "transform",
        (d) => `translate(${xScale(d[xName])}, ${yScale(d[yName])})`
      )
      .attr("id", (d, i) => `${markerType}_${dataId}${i}`)
      .attr("stroke", dataPointsProps.strokeColor)
      .attr("stroke-width", strokeWidth)
      .attr("fill", dataPointsProps.fillColor)
      .on("mouseover", (d, i) => {
        if (isExcludeItem(d)) {
          return;
        }
        select(`#${markerType}_${dataId}${i}`)
          .attr("fill", "#444")
          .attr("stroke", "#444")
          .attr("stroke-width", strokeWidth * 2)
          .transition()
          .duration(animationDuration);
        //tooltip
        d3.selectAll(`.tooltip_${dataId}${i}`).style("display", "block");
      })
      .on("mouseout", (d, i) => {
        if (isExcludeItem(d)) {
          return;
        }
        select(`#${markerType}_${dataId}${i}`)
          .attr("fill", dataPointsProps.fillColor)
          .attr("stroke", dataPointsProps.strokeColor)
          .attr("stroke-width", strokeWidth)
          .transition()
          .duration(animationDuration);
        // tooltip
        d3.selectAll(`.tooltip_${dataId}${i}`).style("display", "none");
      });
  }
  render() {
    return <g className={this.props.className} ref={this.ref} />;
  }
}

export default Markers;
