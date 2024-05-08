import React, { Component } from "react";
import PropTypes from "prop-types";
import { scaleLinear, scaleTime } from "d3-scale";
import { line } from "d3-shape";
import XYAxis from "./xy-axis";
import Line from "./line";
import Markers from "./markers";
import Tooltip from "./tooltip";
import { dateFormat } from "../../helpers/formatit";
import { dateCompare } from "../../helpers/sortit";
import { sumArray, daysFromToday } from "../../helpers/utility";

const defaultFields = {
  x: "date",
  y: "MMEValue",
};
const xFieldName = defaultFields.x;
const yFieldName = defaultFields.y;
export default class MMEGraph extends Component {
  getDefaultDataValueSet(
    value,
    minDate,
    maxDate,
    total,
    xFieldName,
    yFieldName
  ) {
    let data = [];
    value = value || 0;
    total = total || 8;
    xFieldName = xFieldName || defaultFields.x;
    yFieldName = yFieldName || defaultFields.y;

    if (!maxDate) {
      maxDate = new Date();
    }
    if (!minDate) {
      minDate = new Date();
      minDate.setDate(maxDate.getDate() - total * 30);
    }
    let index = 0;
    let increment = Math.ceil((maxDate.getTime() - minDate.getTime()) / total);

    while (index <= total) {
      let addTime = minDate.getTime() + increment * index;
      let item = {};
      item[xFieldName] = new Date(addTime);
      item[yFieldName] = value;
      data.push(item);
      index++;
    }
    return data;
  }
  compareDate(a, b) {
    let calcA = new Date(a[xFieldName]).getTime();
    let calcB = new Date(b[xFieldName]).getTime();
    if (calcA > calcB) return 1;
    if (calcB > calcA) return -1;
    return 0;
  }

  getMaxMMEValue(data) {
    let maxValue = 0;
    data.forEach((item) => {
      maxValue = Math.max(maxValue, item["MMEValue"]);
    });
    return maxValue;
  }

  getStats(data) {
    if (!data || !data.length) return [];
    //look in data points up to today
    const copyData = data
      .map((item) => {
        return { ...item };
      })
      .filter((item) => !(daysFromToday(item[xFieldName]) < 0)); //not future dates
    if (!copyData.length) {
      return [];
    }
    //get all available dates
    let arrDates = copyData.map((item) => item[xFieldName]);
    arrDates = arrDates.filter((d, index) => {
      return arrDates.indexOf(d) === index;
    });
    arrDates = arrDates
      .map((item) => {
        let returnObject = {};
        let pointDate = item;
        returnObject[xFieldName] = pointDate;
        returnObject[yFieldName] = Math.max(
          ...copyData
            .filter((o) => o[xFieldName] === pointDate)
            .map((o) => o[yFieldName])
        );
        return returnObject;
      })
      .sort((a, b) => dateCompare(a[xFieldName], b[xFieldName])); //sort in ascending order
    //helper function for getting average MME
    const averageMME = (days) => {
      let matchedData = arrDates
        .filter((item) => {
          let diff = daysFromToday(item[xFieldName]);
          return diff <= days && diff >= 0;
        })
        .map((item) => parseFloat(item[yFieldName]));
      //console.log("matched data ", matchedData, " days ", days);
      return Math.round(sumArray(matchedData) / days);
    };
    //check matching data point for today
    const arrToday = arrDates
      .filter((item) => daysFromToday(item[xFieldName]) === 0)
      .map((item) => parseFloat(item[yFieldName]));
    const todayMME = arrToday.length ? Math.max(...arrToday) : 0;
    //average MED for last 60 days
    const averageSixtyDays = averageMME(60);
    //average MED for last 90 days
    const averageNintyDays = averageMME(90);
    const mostRecentMME = arrDates[arrDates.length - 1];
    return [
      {
        display: "MED today",
        value: `${todayMME} (${dateFormat("", new Date(), "YYYY-MM-DD")})`,
      },
      {
        display: "Average MED in the last 60 days",
        value: averageSixtyDays,
      },
      {
        display: "Most recent MED",
        value: `${parseInt(mostRecentMME[yFieldName])} (${dateFormat(
          "",
          mostRecentMME[xFieldName],
          "YYYY-MM-DD"
        )})`,
      },
      {
        display: "Average MED in the last 90 days",
        value: averageNintyDays,
      },
    ];
  }

  render() {
    /*
     *  example data format: [{"dateWritten":"2019-04-15","MMEValue":40}, {"dateWritten":"2019-04-15","MMEValue":40, "placeholder":true}]
     */
    let maxDate = new Date();
    let minDate = new Date().setDate(maxDate.getDate() - 365);
    let baseLineDate = new Date();
    const parentWidth = 488;
    const parentHeight = 344;
    const WA_MAX_VALUE = 120;
    const CDC_SECONDARY_MAX_VALUE = 50;
    const CDC_MAX_VALUE = 90;
    const xIntervals = 12;
    let lineParamsSet = [xIntervals, xFieldName, yFieldName];
    const hasError = this.props.error;
    //make a copy of the data so as not to accidentally mutate it
    //need to make sure the dates are sorted for line to draw correctly
    let computedData = this.props.data
      ? this.props.data.map((item) => {
          return {
            ...item,
          };
        })
      : null;
    let data = computedData || [];
    let noEntry = !data || !data.length;
    data = data.filter((d) => d[xFieldName]);
    data = data.map((d) => {
      let dObj = new Date(d[xFieldName]);
      let tzOffset = dObj.getTimezoneOffset() * 60000;
      dObj.setTime(dObj.getTime() + tzOffset);
      d[xFieldName] = dObj;
      return d;
    });
    //get stats for data
    let graphStats = this.getStats(this.props.data);
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
    if (arrMonthsYears.length < xIntervals - 2) {
      /*
       * make sure graph has appropiate end points on the graph
       * if the total count of data points is less than the initial set number of intervals
       */
      let calcMinDate = new Date(minDate.valueOf());
      minDate = calcMinDate.setDate(
        calcMinDate.getDate() - 30 * (xIntervals - arrMonthsYears.length + 1)
      );
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
      let baselineItem = {};
      baselineItem[xFieldName] = baseLineDate;
      baselineItem[yFieldName] = 0;
      baselineItem["baseline"] = true;
      baselineItem["placeholder"] = true;
      data.unshift(baselineItem);
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
        let todayDataPoint = {};
        todayDataPoint[xFieldName] = todayObj;
        todayDataPoint[yFieldName] = 0;
        todayDataPoint["placeholder"] = true;
        data = [...data, todayDataPoint];
        maxDate = new Date();
      }
    }
    let calcMaxDate = new Date(maxDate.valueOf());
    maxDate = calcMaxDate.setDate(calcMaxDate.getDate() + 1);
    maxDate = new Date(maxDate);
    const diffTime = Math.abs(maxDate - minDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let WAData = this.getDefaultDataValueSet(
      WA_MAX_VALUE,
      baseLineDate,
      maxDate,
      ...lineParamsSet
    );
    let CDCSecondaryData = this.getDefaultDataValueSet(
      CDC_SECONDARY_MAX_VALUE,
      baseLineDate,
      maxDate,
      ...lineParamsSet
    );
    let CDCData = this.getDefaultDataValueSet(
      CDC_MAX_VALUE,
      baseLineDate,
      maxDate,
      ...lineParamsSet
    );

    const margins = {
      top: 0,
      right: 56,
      bottom: 48,
      left: 56,
    };

    const width = parentWidth - margins.left - margins.right;
    const height = parentHeight - margins.top - margins.bottom;
    const xScale = scaleTime()
      .domain([baseLineDate, maxDate])
      .rangeRound([0, width]);
    const yMaxValue = Math.max(140, this.getMaxMMEValue(data));
    const yScale = scaleLinear()
      .domain([0, yMaxValue])
      .range([height, 0])
      .nice();

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
      strokeWidth: 2.25,
      markerSize: 4,
    };
    additionalProps["dataPointsProps"] = {
      ...additionalProps,
      ...{
        strokeWidth: 2.5,
        strokeFill: dataStrokeColor,
      },
    };
    const tickInterval = Math.ceil(diffDays / 30 / xIntervals);

    const xSettings = {
      scale: xScale,
      orient: "bottom",
      transform: `translate(0, ${height})`,
      tickFormat: "%b %Y",
      tickType: "date",
      tickInterval: tickInterval || 1,
      ticks: xIntervals,
    };
    const ySettings = {
      scale: yScale,
      orient: "left",
      transform: "translate(0, 0)",
      ticks: 10,
    };

    const defaultLegendSettings = {
      fontFamily: "sans-serif",
      fontSize: yMaxValue >= 600 ? "8px" : "12px",
      fontWeight: "600",
      letterSpacing: "0.02rem",
      x: xScale(baseLineDate) + 8,
    };

    const WA_COLOR = "#a75454";
    const CDC_COLOR = "#c57829";
    const textMargin = 4;
    const WALegendSettings = {
      y: yScale(120 + textMargin),
      fill: WA_COLOR,
      ...defaultLegendSettings,
    };
    const CDCLegendSettings = {
      fill: CDC_COLOR,
      ...defaultLegendSettings,
    };

    const dataLineProps = { ...defaultProps, ...additionalProps };
    const graphWidth = width + margins.left + margins.right;
    const graphHeight = height + margins.top + margins.bottom;
    if (hasError) {
      return (
        <div className="MMEgraph no-entry">
          <div className="title">Morphine Equivalent Dose (MED)</div>
          <div className="no-entry error">
            Graph not shown. One or more of this patient's opioid medications
            was not found in RxNav, therefore the MED could not be calculated
            and the summary graph will be incorrect.
            <br />
            Please use the information in the State PMP Prescriptions table
            below to calculate the patient's MED.
          </div>
        </div>
      );
    }
    if (noEntry) {
      return (
        <div className="MMEgraph no-entry">
          <div className="title">Morphine Equivalent Dose (MED)</div>
          <div className="no-entry">
            No opioid Rx found for this patient in the PMP
          </div>
        </div>
      );
    }
    return (
      <React.Fragment>
        <div className="MMEgraph">
          <div className="title">Morphine Equivalent Dose (MED)</div>
          <div className="MME-svg-container">
            <svg
              className="MMEChartSvg"
              width="100%"
              height="100%"
              viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            >
              <g transform={`translate(${margins.left}, ${margins.top})`}>
                <XYAxis {...{ xSettings, ySettings }} />
                <Line lineID="dataLine" data={data} {...dataLineProps} />
                <Markers data={data} {...dataLineProps} />
                <Line
                  lineID="WALine"
                  strokeColor={WA_COLOR}
                  dotted="true"
                  dotSpacing="3, 3"
                  data={WAData}
                  {...defaultProps}
                />
                <Line
                  lineID="CDCSecondaryLine"
                  strokeColor={CDC_COLOR}
                  dotted="true"
                  dotSpacing="3, 3"
                  data={CDCSecondaryData}
                  {...defaultProps}
                />
                <Line
                  lineID="CDCLine"
                  strokeColor={CDC_COLOR}
                  dotted="true"
                  dotSpacing="3, 3"
                  data={CDCData}
                  {...defaultProps}
                />
                <Tooltip data={data} {...dataLineProps}></Tooltip>
                <text {...WALegendSettings}>
                  Washington State consultation threshold
                </text>
                <text {...CDCLegendSettings} y={yScale(50 + textMargin)}>
                  CDC extra precautions threshold
                </text>
                <text {...CDCLegendSettings} y={yScale(90 + textMargin)}>
                  CDC avoid/justify threshold
                </text>
              </g>
            </svg>
          </div>
        </div>
        {graphStats.length > 0 && (
          <div className="stats-container">
            {graphStats.map((item, index) => (
              <div className="stats-item" key={item.value + index}>
                <span className="title">{item.display}</span>
                <span className="description">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </React.Fragment>
    );
  }
}

MMEGraph.propTypes = {
  data: PropTypes.array,
  error: PropTypes.bool,
};
