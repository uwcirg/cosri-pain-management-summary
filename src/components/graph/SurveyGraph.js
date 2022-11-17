import React, { Component } from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";
import { scaleLinear, scaleTime } from "d3-scale";
import { line } from "d3-shape";
import XYAxis from "./xy-axis";
import Line from "./line";
import { dateFormat } from "../../helpers/formatit";
import qConfig from "../../config/questionnaire_config";
// import { max } from "d3";
// import { dateCompare } from "../../helpers/sortit";
// import { sumArray, daysFromToday } from "../../helpers/utility";

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
    const parentWidth = 488;
    const parentHeight = 380;
    const xIntervals = 12;
    //make a copy of the data so as not to accidentally mutate it
    //need to make sure the dates are sorted for line to draw correctly
    // let computedData = this.props.data
    //   ? this.props.data.map((item) => {
    //       return {
    //         ...item,
    //       };
    //     })
    //   : null;
    let data = this.props.data || [];
    console.log("data? ", data);
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
    //var parseDate = d3.timeParse("%Y-%m-%d");

    data.forEach((item) => {
      console.log("date? ", item[xFieldName]);
      // item[xFieldName] = parseDate(item[xFieldName]);
      item[yFieldName] = +item[yFieldName];
    });
    // console.log("formatted data ", data)
    // const xExtent = d3.extent(data, (d) => d[xFieldName]);

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
      // let baselineItem = {};
      // baselineItem[xFieldName] = baseLineDate;
      // baselineItem[yFieldName] = 0;
      // baselineItem["baseline"] = true;
      // baselineItem["placeholder"] = true;
      // data.unshift(baselineItem);
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
        // let todayDataPoint = {};
        // todayDataPoint[xFieldName] = todayObj;
        // todayDataPoint[yFieldName] = 0;
        // todayDataPoint["placeholder"] = true;
        // data = [...data, todayDataPoint];
        maxDate = new Date();
      }
    }
    let calcMaxDate = new Date(maxDate.valueOf());
    maxDate = calcMaxDate.setDate(calcMaxDate.getDate() + 31);
    maxDate = new Date(maxDate);

    const margins = {
      top: 16,
      right: 64,
      bottom: 88,
      left: 64,
    };

    const width = parentWidth - margins.left - margins.right;
    const height = parentHeight - margins.top - margins.bottom;
    const xScale = scaleTime()
      .domain([baseLineDate, maxDate])
      .rangeRound([0, width]);
    const yMaxValue = d3.max(data, (d) => d.score);
    console.log("yMax ", yMaxValue);
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
    console.log("dataNest ", dataNest);

    // d3.select("svg")
    //   .selectAll(".line")
    //   .append("g")
    //   .attr("class", "line")
    //   .data(sumstat)
    //   .enter()
    //   .append("path")
    //   .attr("d", function (d) {
    //     return d3
    //       .line()
    //       .x((d) => xScale(d[xFieldName]))
    //       .y((d) => yScale(d[yFieldName]))
    //       .curve(d3.curveCardinal)(d.values);
    //   })
    //   .attr("fill", "none")
    //   .attr("stroke", (d) => "red")
    //   .attr("stroke-width", 2);

    // //append circle
    // d3.select("svg")
    //   .selectAll("circle")
    //   .append("g")
    //   .data(data)
    //   .enter()
    //   .append("circle")
    //   .attr("r", 6)
    //   .attr("cx", (d) => xScale(d.year))
    //   .attr("cy", (d) => yScale(d.spending))
    //   .style("fill", (d) => "red");

    //set color pallete for different vairables
    // var qids = sumstat.map((d) => d.key);
    // var color = d3.scaleOrdinal().domain(qids).range(["green", "blue", "orange"]);

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

    // const defaultLegendSettings = {
    //   fontFamily: "sans-serif",
    //   fontSize: yMaxValue >= 600 ? "8px" : "12px",
    //   fontWeight: "600",
    //   letterSpacing: "0.02rem",
    //   x: xScale(baseLineDate) + 8,
    // };

    // const textMargin = 4;

    //const dataLineProps = { ...defaultProps, ...additionalProps };
    const graphWidth = width + margins.left + margins.right;
    const graphHeight = height + margins.top + margins.bottom;
    const labelProps = {
      transform: "rotate(-90)",
      y: 0 - margins.left,
      x: 0 - (graphHeight/2),
      dy: "1em",
    };

    if (noEntry) return <div>No survey data to show.</div>;

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
                <XYAxis {...{ xSettings, ySettings }} />
                <text className="axis-label" {...labelProps}>Value/Score</text>
                {dataNest.map((data) => {
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
                    <Line lineID={`dataLine_${data.key}`} data={data.values} {...lineProps} />
                  );
                })}
              </g>
            </svg>
          </div>
          <div className="legend">
            {dataNest.map((data) => (
              <div className="legend__item">
                <span
                  className="icon"
                  style={{ backgroundColor: qConfig[data.key].graph.strokeColor}}
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
