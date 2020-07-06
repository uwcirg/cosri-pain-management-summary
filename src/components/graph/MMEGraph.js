import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { scaleLinear, scaleTime } from 'd3-scale';
import { line, curveMonotoneX } from 'd3-shape';
import XYAxis from './xy-axis';
import Line from './line';

export default class MMEGraph extends Component {

  getDefaultDataValueSet(value, minDate, maxDate, total, xFieldName, yFieldName) {
    let data = [];
    value = value || 0;
    total = total || 10;
    xFieldName = xFieldName || "dateWritten";
    yFieldName = yFieldName || "MMEValue";
    if (!maxDate) {
      maxDate = new Date();
    }
    if (!minDate) {
      minDate = new Date();
      minDate.setDate(maxDate.getDate() - total * 30);
    }
    let index = 0;
    let increment = Math.ceil((maxDate.getTime() - minDate.getTime()) / total);
    while(index <= total) {
      let addTime = minDate.getTime() + increment*index;
      let item = {};
      item[xFieldName] = new Date(addTime);
      item[yFieldName] = value;
      data.push(item);
      index++;
    }
    return data;
  }
  compareDate(a, b) {
    let calcA = (new Date(a.dateWritten)).getTime();
    let calcB = (new Date(b.dateWritten)).getTime();
    if (calcA > calcB) return 1;
    if (calcB > calcA) return -1;
    return 0;
  }

  render() {
    /*
     *  example data format: [{"dateWritten":"2019-04-15","MMEValue":40}, {"dateWritten":"2019-04-15","MMEValue":40}]
     */
    let maxDate = new Date();
    let minDate = new Date();
    minDate.setDate(maxDate.getDate() - 365); 
    const parentWidth = 536;
    const WA_MAX_VALUE = 120;
    const CDC_SECONDARY_MAX_VALUE = 50;
    const CDC_MAX_VALUE = 90;
    const xFieldName = "dateWritten";
    const yFieldName = "MMEValue";
    const xIntervals = 8;
    let lineParamsSet = [xIntervals, xFieldName, yFieldName];
    //need to make sure the dates are sorted for line to draw correctly
    let computedData = this.props.data? (this.props.data).sort(this.compareDate): null;
    let data  = computedData || this.getDefaultDataValueSet(0, minDate, maxDate, ...lineParamsSet);
    let noEntry = !data || !data.length;

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
    if (arrayDates.length) {
      maxDate = new Date(Math.max.apply(null, arrayDates))
      minDate = new Date(Math.min.apply(null, arrayDates));
    }
    if (arrayDates.length < (xIntervals - 2)) {
      let calcMinDate = new Date(minDate.valueOf());
      let calcMaxDate = new Date(maxDate.valueOf());
      minDate = calcMinDate.setDate(calcMinDate.getDate() - 30);
      maxDate = calcMaxDate.setDate(calcMaxDate.getDate() + 30);
      maxDate = new Date(Math.max(Math.max.apply(null, arrayDates), new Date()))
      minDate = new Date(Math.min(Math.min.apply(null, arrayDates), minDate));
    }
    let WAData = this.getDefaultDataValueSet(WA_MAX_VALUE, minDate, maxDate, ...lineParamsSet);
    let CDCSecondaryData = this.getDefaultDataValueSet(CDC_SECONDARY_MAX_VALUE, minDate, maxDate, ...lineParamsSet);
    let CDCData = this.getDefaultDataValueSet(CDC_MAX_VALUE, minDate, maxDate, ...lineParamsSet);
    
    const margins = {
      top: 40,
      right: 52,
      bottom: 52,
      left: 52,
    };

    const width = parentWidth - margins.left - margins.right;
    const height = 360 - margins.top - margins.bottom;
    const xScale = scaleTime().domain([minDate, maxDate]).rangeRound([0, width]).nice();

    const yScale = scaleLinear()
      .domain([0, 140])
      .range([height, 0])
      .nice();

    const lineGenerator = line()
      .x(d => xScale(d[xFieldName]))
      .y(d => yScale(d[yFieldName]))
      .curve(curveMonotoneX);


    const defaultProps = {
        xScale: xScale,
        yScale: yScale,
        lineGenerator: lineGenerator,
        width: width,
        height: height,
        xName: xFieldName,
        yName: yFieldName
    };

    const additionalProps = {};
    //if (data.length === 1) {
      additionalProps["dataPoints"] = {
        "strokeColor": "#217684",
        "strokeFill": "#217684",
        "strokeWidth": 2
      }
    //}

    const xSettings = {
      scale: xScale,
      orient: 'bottom',
      transform: `translate(0, ${height})`,
      tickFormat: "%b %y",
      tickType: "date",
      ticks: xIntervals
    };
    const ySettings = {
      scale: yScale,
      orient: 'left',
      transform: 'translate(0, 0)',
      ticks: 10
    };

    const defaultLegendSettings = {
      "fontFamily": "sans-serif",
      "fontSize": "12px",
      "fontWeight": "600",
      "x": 16
    };
    const WA_COLOR = "#a75454";
    const CDC_COLOR = "#e09b1d";
    const WALegendSettings = {
      "y": 30,
      "fill": WA_COLOR,
      ...defaultLegendSettings
    };
    const CDCLegendSettings = {
      "fill": CDC_COLOR,
      ...defaultLegendSettings
    }

    const dataLineProps = {...defaultProps, ...additionalProps};
    const graphWidth = width + margins.left + margins.right;
    const graphHeight = height + margins.top + margins.bottom;

    return (
      <div className="MMEgraph">
        <div className="title">Morphine Equivalent Dose (MED)</div>
        <div className="MME-svg-container">
          <svg
            className="MMEChartSvg"
            // width={width + margins.left + margins.right}
            // height={height + margins.top + margins.bottom}
            //preserveAspectRatio="none"
            width="100%"
            viewBox = {`0 0 ${graphWidth} ${graphHeight}`}
          >
            <g transform={`translate(${margins.left}, ${margins.top})`}>
              <XYAxis {...{xSettings, ySettings}} />
              <Line lineID="WALine" strokeColor={WA_COLOR} dotted="true" dotSpacing="3, 3" data={WAData} {...defaultProps} />
              <Line lineID="CDCSecondaryLine" strokeColor={CDC_COLOR} dotted="true" dotSpacing="3, 3" data={CDCSecondaryData} {...defaultProps} />
              <Line lineID="CDCLine" strokeColor={CDC_COLOR} dotted="true" dotSpacing="3, 3" data={CDCData} {...defaultProps} />
              <text {...WALegendSettings}>Washington State consultation threshold</text>
              <text {...CDCLegendSettings} y="164">CDC extra precautions threshold</text>
              <text {...CDCLegendSettings} y="88">CDC avoid/justify threshold</text>
              <Line lineID="dataLine" data={data} {...dataLineProps} />
              {noEntry && 
                <text {...defaultLegendSettings} x={width/2 - 20} y={height/2} strokeColor="#777" fill="#777">No entry found</text>
              }
            </g>
          </svg>
        </div>
      </div>
    );
  }
}

MMEGraph.propTypes = {
  data: PropTypes.array
};
