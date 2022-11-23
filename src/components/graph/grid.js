import React from "react";
import { select } from "d3-selection";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleLinear } from "d3-scale";

class Grid extends React.Component {
  constructor() {
    super();
    this.ref = React.createRef();
  }
  componentDidMount() {
    this.renderGridLines();
  }

  renderGridLines() {
    const { width, height, numTicks, orientation } = this.props;
    const node = this.ref.current;
    let GridLines;
    let axis = orientation === "bottom" ? axisBottom : axisLeft;
    if (orientation === "bottom") {
    const xScale = scaleLinear().domain([0, 1]).range([0, width]);
      GridLines = axis(xScale)
        .ticks(numTicks || 5)
        .tickSize(-height)
        .tickFormat("");
      select(node).call(GridLines).style("stroke-dasharray", "2, 2");
    } else {
      const yScale = scaleLinear().domain([0, 1]).range([height, 0]);
      GridLines = axis(yScale).ticks(numTicks || 5).tickSize(-width).tickFormat("");
      select(node).call(GridLines).style("stroke-dasharray", "2, 2");
    }
  }

  render() {
    const { height, orientation } = this.props;
    return (
      <g
        ref={this.ref}
        transform={orientation === "bottom" ?`translate(0, ${height})`: ""}
        className={`grid`}
      />
    );
  }
}

export default Grid;
