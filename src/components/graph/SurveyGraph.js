import React, { Component } from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";
import { scaleLinear, scaleTime } from "d3-scale";
import { line } from "d3-shape";
import XYAxis from "./xy-axis";
import Grid from "./grid";
import Line from "./line";
import { dateFormat } from "../../helpers/formatit";
import qConfig from "../../config/questionnaire_config";

const defaultFields = {
  x: "date",
  y: "score",
};
const xFieldName = defaultFields.x;
const yFieldName = defaultFields.y;
export default class SurveyGraph extends Component {
  compareDate(a, b) {
    let calcA = new Date(a[xFieldName]).getTime();
    let calcB = new Date(b[xFieldName]).getTime();
    if (calcA > calcB) return 1;
    if (calcB > calcA) return -1;
    return 0;
  }

  render() {
    const parentWidth = 500;
    const parentHeight = 396;
    const xIntervals = 12;
    let propData = this.props.data || [];
    //make a copy of the data so as not to accidentally mutate it
    //need to make sure the dates are sorted for line to draw correctly
    let data = propData
      ? propData.map((item) => {
          return {
            ...item,
          };
        })
      : [];
    let noEntry = !data || !data.length;
    let baseLineDate = new Date();
    let maxDate = new Date();
    let minDate = new Date().setDate(maxDate.getDate() - 365);
    data = data.filter((d) => d[xFieldName]);
    data = data.map((d) => {
      let dObj = new Date(d[xFieldName]);
      let tzOffset = dObj.getTimezoneOffset() * 60000;
      dObj.setTime(dObj.getTime() + tzOffset);
      d[xFieldName] = dObj;
      return d;
    });

    data.forEach((item) => {
      item[yFieldName] = +item[yFieldName];
    });

    let arrayDates = data.map((d) => {
      return d[xFieldName];
    });
    if (arrayDates.length) {
      maxDate = new Date(Math.max.apply(null, arrayDates));
      minDate = new Date(Math.min.apply(null, arrayDates));
    }
    const arrMonthsYears = [];
    //date axis is in month intervals so check to see how many there are
    arrayDates.forEach((item) => {
      let my = item.getMonth() + 1 + " " + item.getFullYear();
      if (arrMonthsYears.indexOf(my) === -1) arrMonthsYears.push(my);
    });
    if (arrMonthsYears.length < 4) {
      /*
       * make sure graph has appropiate end points on the graph
       * if the total count of data points is less than the initial set number of intervals
       */
      let calcMinDate = new Date(minDate.valueOf());
      minDate = calcMinDate.setDate(calcMinDate.getDate() - 30);
      minDate = new Date(minDate);
      //console.log("min date ", minDate, " max date ", maxDate)
    }
    if (arrayDates.length) {
      /*
       * set up baseline data point starting at 0
       */
      baseLineDate.setTime(
        new Date(minDate.valueOf()).getTime() - 30 * 24 * 60 * 60 * 1000
      );
      /*
       * set end point to today if not present
       */
      let todayObj = new Date();
      let today = dateFormat("", todayObj, "YYYY-MM-DD");
      const containedTodayData =
        data.filter(
          (item) => dateFormat("", item[xFieldName], "YYYY-MM-DD") === today
        ).length > 0;
      if (!containedTodayData) {
        maxDate = new Date();
      }
    }
    let calcMaxDate = new Date(maxDate.valueOf());
    maxDate = calcMaxDate.setDate(calcMaxDate.getDate() + 31);
    maxDate = new Date(maxDate);

    const margins = {
      top: 24,
      right: 64,
      bottom: 96,
      left: 64,
    };

    const width = parentWidth - margins.left - margins.right;
    const height = parentHeight - margins.top - margins.bottom;
    const xScale = scaleTime()
      .domain([baseLineDate, maxDate])
      .rangeRound([0, width]);
    const yMaxValue = d3.max(data, (d) => d.score);
    const yScale = scaleLinear()
      .domain([0, yMaxValue + 10])
      .range([height, 0])
      .nice();

    //use .nest()function to group data so the line can be computed for each group

    // Nest the entries by symbol
    var dataNest = d3
      .nest()
      .key(function (d) {
        return d.qid;
      })
      .entries(data);

    console.log("survey graph data nest ", dataNest);

    const lineGenerator = line()
      .x((d) => xScale(d[xFieldName]))
      .y((d) => yScale(d[yFieldName]));

    const defaultProps = {
      xScale: xScale,
      yScale: yScale,
      lineGenerator: lineGenerator,
      width: width,
      height: height,
      xName: xFieldName,
      yName: yFieldName,
    };
    const dataStrokeColor = "#168698";
    const additionalProps = {
      strokeColor: dataStrokeColor,
      strokeFill: dataStrokeColor,
      strokeWidth: "2.25",
    };
    additionalProps["dataPoints"] = {
      ...additionalProps,
      ...{
        dataStrokeWidth: "4",
        dataStrokeFill: dataStrokeColor,
      },
    };
    const tickInterval = 1;

    const xSettings = {
      scale: xScale,
      orient: "bottom",
      transform: `translate(0, ${height})`,
      tickFormat: "%b %Y",
      tickType: "date",
      tickInterval: tickInterval,
      ticks: Math.min(arrMonthsYears.length, xIntervals),
    };
    const ySettings = {
      scale: yScale,
      orient: "left",
      transform: "translate(0, 0)",
      ticks: 10,
    };

    const graphWidth = width + margins.left + margins.right;
    const graphHeight = height + margins.top + margins.bottom;
    const labelProps = {
      transform: "rotate(-90)",
      y: 0 - margins.left,
      x: 0 - graphHeight / 2,
      dy: "1em",
    };

    if (noEntry)
      return (
        <div>
          <b>No graph for questionnaire scores to show.</b>
        </div>
      );

    return (
      <React.Fragment>
        <div className="survey-graph">
          <div className="survey-svg-container">
            <svg
              className="surveyChartSvg"
              width="100%"
              height="100%"
              viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            >
              <g transform={`translate(${margins.left}, ${margins.top})`}>
                {/* y grid */}
                <Grid
                  {...{
                    width: width,
                    height: height,
                    numTicks: 5,
                    orientation: "left",
                  }}
                ></Grid>
                {/* x grid */}
                <Grid
                  {...{
                    width: width,
                    height: height,
                    numTicks: 10,
                    orientation: "bottom",
                  }}
                ></Grid>
                <XYAxis {...{ xSettings, ySettings }} />
                <text className="axis-label" {...labelProps}>
                  Value / Score
                </text>
                {dataNest.map((data, index) => {
                  const lineProps = {
                    ...defaultProps,
                    ...{
                      ...qConfig[data.key].graph,
                    },
                  };
                  console.log(
                    "data key ",
                    data.key,
                    " config ",
                    qConfig[data.key]
                  );
                  return (
                    <Line
                      key={`line-${data.key}-${index}`}
                      lineID={`dataLine_${data.key}`}
                      data={data.values}
                      {...lineProps}
                    />
                  );
                })}
              </g>
            </svg>
          </div>
          <div className="legend">
            {dataNest.map((data, index) => (
              <div className="legend__item" key={`legend_${data.key}_${index}`}>
                <span
                  className="icon"
                  style={{
                    backgroundColor: qConfig[data.key].graph.strokeColor,
                  }}
                ></span>
                {data.key.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </React.Fragment>
    );
  }
}

SurveyGraph.propTypes = {
  data: PropTypes.array,
};
