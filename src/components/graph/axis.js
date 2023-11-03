import React from "react";
import { select } from "d3-selection";
import { timeFormat } from "d3-time-format";
import { axisBottom, axisLeft } from "d3-axis";
import { timeMonth } from "d3-time";

class Axis extends React.Component {
  constructor() {
    super();
    this.ref = React.createRef();
  }

  componentDidMount() {
    this.renderAxis();
  }

  componentDidUpdate() {
    //  this.removeAll();
    this.renderAxis();
  }
  removeAll() {
    const node = this.ref.current;
    let currentNode = select(node);
    currentNode.selectAll(".tick text").remove();
  }
  renderAxis() {
    const node = this.ref.current;
    const { scale, orient, ticks, tickType, tickFormat, tickInterval } =
      this.props;
    let axis;

    if (orient === "bottom") {
      axis = axisBottom(scale);
      if (tickType === "date") {
        axis.tickFormat(timeFormat(tickFormat || "%d %b %y"));
        //spaced out ticks by month in tick interval
        axis.ticks(timeMonth.every(tickInterval));
      } else axis.ticks(ticks);
      select(node)
        .call(axis)
        .selectAll(".bottom .tick text")
        .style("transform", "translateY(36px) translateX(-12px) rotate(-90deg)")
        .style("font-size", "0.7rem");
    }
    //TODO allow other tick type and formatting here
    if (orient === "left") {
      axis = axisLeft(scale).ticks(ticks);
      select(node)
        .call(axis)
        .selectAll(".left .tick text")
        .style("font-size", "0.7rem");
    }
  }
  render() {
    const { orient, transform, className } = this.props;
    return (
      <g
        ref={this.ref}
        transform={transform}
        className={`${orient} axis ${className}`}
      />
    );
  }
}

export default Axis;
