import React, { Component } from 'react';
import { scaleLinear, scaleBand } from 'd3-scale';
import XYAxis from './xy-axis';
import Line from './line';
import { line, curveMonotoneX } from 'd3-shape';
import { transition } from 'd3-transition';

export default class MMEGraph extends Component {
  render() {
    const data  = this.props.data;
    const parentWidth = 820;
    let WAData = [];
    let CDCData = [];
    data.forEach(d => {
        WAData.push({
            "MMEValue": 120,
            "dateWritten": d.dateWritten
        });
    });
    data.forEach(d => {
        CDCData.push({
            "MMEValue": 90,
            "dateWritten": d.dateWritten
        });
    })

    const margins = {
      top: 20,
      right: 20,
      bottom: 80,
      left: 60,
    };

    const width = parentWidth - margins.left - margins.right;
    const height = 320 - margins.top - margins.bottom;

    const ticks = 5;
    const t = transition().duration(1000);

    const xScale = scaleBand()
      .domain(data.map(d => d.dateWritten))
      .rangeRound([0, width]).padding(0.1);

    const yScale = scaleLinear()
      .domain([0, 140])
      .range([height, 0])
      .nice();

    const lineGenerator = line()
      .x(d => xScale(d.dateWritten))
      .y(d => yScale(d.MMEValue))
      .curve(curveMonotoneX);


    const defaultProps = {
        Scale: xScale,
        yScale: yScale,
        lineGenerator: lineGenerator,
        width: width,
        height: height,
        xName: "dateWritten",
        yName: "MMEValue"
    };

    return (
      <div className="MMEgraph">
        <div className="title">Morphine Milligram Equivalency Trend Graph</div>
        <svg
          className="MMEChartSvg"
          width={width + margins.left + margins.right}
          height={height + margins.top + margins.bottom}
        >
          <g transform={`translate(${margins.left}, ${margins.top})`}>
            <XYAxis {...{ xScale, yScale, height, ticks, t }} />
            <Line lineID="dataLine" data={data} {...defaultProps} />
            <Line lineID="WALine" strokeColor="#a75454" dotted="true" dotSpacing="3, 3" data={WAData} {...defaultProps} />
            <Line lineID="CDCLine" strokeColor="#e09b1d" dotted="true" dotSpacing="5, 5" data={CDCData} {...defaultProps} />
          </g>
        </svg>
        <legend>
            <div>
                <span className="icon CDC"></span>CDC recommended maximum
            </div>
            <div>
                <span className="icon WA"></span>Washington State recommended maximum
            </div>
        </legend>
      </div>
    );
  }
}
