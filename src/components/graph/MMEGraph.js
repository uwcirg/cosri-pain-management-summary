import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { scaleLinear, scaleTime } from 'd3-scale';
import { line, curveMonotoneX } from 'd3-shape';
import XYAxis from './xy-axis';
import Line from './line';


export default class MMEGraph extends Component {
  getDefaultDataSet() {
    let index = 0, data = [];
    while(index < 10) {
      let date = new Date();
      if (index > 0) {
        date.setDate((new Date()).getDate() + index*30);
      }
      data.push({
        "dateWritten": date.toLocaleString(),
        "MMEValue": 0
      });
      index++;
    }
    return data;
  }

  render() {
    /*
     *  example data format: [{"dateWritten":"2019-04-15","MMEValue":40}, {"dateWritten":"2019-04-15","MMEValue":40}]
     */
    let data  = this.props.data;
    const parentWidth = 640;
    const WA_MAX_VALUE = 120;
    const CDC_MAX_VALUE = 90;
    const xFieldName = "dateWritten";
    const yFieldName = "MMEValue";
    let WAData = [];
    let CDCData = [];
    let noEntry = !data || !data.length;

    data = data || this.getDefaultDataSet();
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
    let maxDate = new Date();
    let minDate = new Date();
    minDate.setDate(maxDate.getDate() - 365); 
    if (arrayDates.length) {
      maxDate = new Date(Math.max.apply(null, arrayDates));
      minDate = new Date(Math.min.apply(null, arrayDates));
    }

    console.log("max date: ", maxDate, " min date ", minDate)
    
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
      bottom: 52,
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
      tickFormat: "%b %y",
      tickType: "date"
    };
    const ySettings = {
      scale: yScale,
      orient: 'left',
      transform: 'translate(0, 0)',
      ticks: 10,
    };

    const defaultLegendSettings = {
      "fontFamily": "sans-serif",
      "fontSize": "12px",
      "fontWeight": "600",
      "x": margins.left - 44
    };
    const WALegendSettings = {
      "y": 25,
      "fill": "#a75454",
      ...defaultLegendSettings
    };
    const CDCLegendSettings = {
      "y": 74,
      "fill": "#e09b1d",
      ...defaultLegendSettings
    }

    return (
      <div className="MMEgraph">
        <div className="title">Morphine Equivalent Dose (MED)</div>
        <svg
          className="MMEChartSvg"
          width={width + margins.left + margins.right}
          height={height + margins.top + margins.bottom}
        >
          <g transform={`translate(${margins.left}, ${margins.top})`}>
            <XYAxis {...{xSettings, ySettings}} />
            <Line lineID="dataLine" data={data} {...defaultProps} />
            <Line lineID="WALine" strokeColor="#a75454" dotted="true" dotSpacing="3, 3" data={WAData} {...defaultProps} />
            <Line lineID="CDCLine" strokeColor="#e09b1d" dotted="true" dotSpacing="3, 3" data={CDCData} {...defaultProps} />
            <text {...WALegendSettings}>Washington State consultation threshold</text>
            <text {...CDCLegendSettings}>CDC recommended maximum</text>
            {noEntry && 
              <text {...defaultLegendSettings} x={width/2 - 20} y={height/2} strokeColor="#777" fill="#777">No entry found</text>
            }
          </g>
        </svg>
        {/* <legend>
            <div>
                <span className="icon CDC"></span>CDC recommended maximum
            </div>
            <div>
                <span className="icon WA"></span>Washington State consultation threshold
            </div>
        </legend> */}
      </div>
    );
  }
}

MMEGraph.propTypes = {
  data: PropTypes.array
};
