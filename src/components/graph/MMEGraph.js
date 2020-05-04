import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { scaleLinear, scaleTime } from 'd3-scale';
import { line, curveMonotoneX } from 'd3-shape';
import XYAxis from './xy-axis';
import Line from './line';


export default class MMEGraph extends Component {
  render() {
    /*
     *  example data format: [{"dateWritten":"2019-04-15","MMEValue":40}, {"dateWritten":"2019-04-15","MMEValue":40}]
     */
    let data  = this.props.data;
    const parentWidth = 840;
    const WA_MAX_VALUE = 120;
    const CDC_MAX_VALUE = 90;
    const xFieldName = "dateWritten";
    const yFieldName = "MMEValue";
    let WAData = [];
    let CDCData = [];
    data = data.map(d => {
      let dObj = new Date(d.dateWritten);
      let tzOffset = dObj.getTimezoneOffset() * 60000;
      dObj.setTime(dObj.getTime() + tzOffset);
      d.dateWritten = dObj;
      return d;
    });
    let arrayDates = data.map(d => {
    
      return d.dateWritten;
    });
    let maxDate = new Date(Math.max.apply(null, arrayDates));
    let minDate = new Date(Math.min.apply(null, arrayDates));
    
    data.forEach(d => {
      let waObj = {};
      waObj[xFieldName] = d[xFieldName];
      waObj[yFieldName] = WA_MAX_VALUE;
      WAData.push(waObj);
    });
    data.forEach(d => {
      let CDCObj = {};
      CDCObj[xFieldName] = d[xFieldName];
      CDCObj[yFieldName] = CDC_MAX_VALUE;
      CDCData.push(CDCObj);
    })

    const margins = {
      top: 40,
      right: 40,
      bottom: 60,
      left: 70,
    };

    const width = parentWidth - margins.left - margins.right;
    const height = 320 - margins.top - margins.bottom;
    const xScale = scaleTime().domain([minDate, maxDate]).range([0, width]);

    const yScale = scaleLinear()
      .domain([0, 140])
      .range([height, 0])
      .nice();

    const lineGenerator = line()
      .x(d => xScale(d[xFieldName]))
      .y(d => yScale(d[yFieldName]))
      .curve(curveMonotoneX);


    const defaultProps = {
        Scale: xScale,
        yScale: yScale,
        lineGenerator: lineGenerator,
        width: width,
        height: height,
        xName: xFieldName,
        yName: yFieldName
    };

    const xSettings = {
      scale: xScale,
      orient: 'bottom',
      transform: `translate(0, ${height})`,
      tickFormat: "%d %b %y",
      tickType: "date"
    };
    const ySettings = {
      scale: yScale,
      orient: 'left',
      transform: 'translate(0, 0)',
      ticks: 6,
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
            <XYAxis {...{xSettings, ySettings}} />
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

MMEGraph.propTypes = {
  data: PropTypes.object.isRequired
};
