import React from "react";
import * as d3 from "d3";
import { select } from "d3-selection";

class Area extends React.Component {
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
    // this.removeAll();
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
    currentNode.selectAll(".area").remove();
  }
  updateChart() {
    const node = this.ref.current;
    const { data, xName, yName, xScale, yScale } = this.props;

    //data in this format [{x: [....], y: [....]}, {x: [.......], y:[......]}]

    this.setState({
      xName: xName,
      yName: yName,
      data: data,
    });
    var indexies = d3.range(data[0].x.length);
    // define the area
    let area = d3
      .area()
      .x(function (d) {
        return xScale(data[0].x[d]);
      })
      .y0(function (d) {
        return yScale(data[1].y[d]);
      })
      .y1(function (d) {
        return yScale(data[0].y[d]);
      });
    select(node)
      .append("path")
      .datum(indexies)
      .attr("class", "area")
      .attr("fill", "lightsteelblue")
      .attr("d", area);
  }
  render() {
    return <g className={this.props.className} ref={this.ref} />;
  }
}

export default Area;
