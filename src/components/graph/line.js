import React from 'react';
import { select } from 'd3-selection';
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
    console.log("node? ", node)
    const { data, lineGenerator, xName, yName } = this.props;
    
    this.setState({
      xName: xName,
      yName: yName
    });

    console.log('in line ', data);

    // const initialDataObject = {};
    // initialDataObject[xName] = "0";
    // initialDataObject[yName] = 0;

   // const initialData = data.map(d => (initialDataObject));

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

    // select(node)
    //   .selectAll('circle')
    //   .data(data)
    //   .enter()
    //   .append('circle')
    //   .attr('class', 'circle')
    //   .attr('stroke', '#333')
    //   .attr('stroke-width', '1')
    //   .attr('fill', '#333')
    //   .attr('r', 3)
    //   .attr('cx', d => xScale(d[this.state.xName]))
    //   .attr('cy', d => yScale(d[this.state.yName]));

    this.updateChart()
  }
  componentDidUpdate() {
    this.updateChart();
  }
  updateChart() {
    // const {
    //       lineGenerator, xScale, yScale, data,
    //     } = this.props;
    const {
          lineGenerator, data,
        } = this.props;

    const t = transition().duration(1000);

    const line = select('#line');
    //const dot = selectAll('.circle');

    line
      .datum(data)
      .transition(t)
      .attr('d', lineGenerator);

    // dot
    //   .data(data)
    //   .transition(t)
    //   .attr('cx', d => xScale(d[this.state.xName]))
    //   .attr('cy', d => yScale(d[this.state.yName]));
  }
  render() {
    return <g className={this.props.className} ref={this.ref} />;
  }
}

export default Line;
