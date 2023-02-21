import React, { Component } from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";
import { scaleLinear, scaleTime } from "d3-scale";
import { line } from "d3-shape";
import XYAxis from "./xy-axis";
import Grid from "./grid";
import Line from "./line";
import { dateFormat } from "../../helpers/formatit";
import {
  defaultLineAttributes,
  getLineAttributes,
} from "../../config/graph_config";

const defaultFields = {
  x: "date",
  y: "score",
};
const xFieldName = defaultFields.x;
const yFieldName = defaultFields.y;
export default class SurveyGraph extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      graphData: [],
      originalGraphData: [],
    };
    // This binding is necessary to make `this` work in the callback
    this.addQuestionnaireToSurveyGraph =
      this.addQuestionnaireToSurveyGraph.bind(this);
    this.removeQuestionnaireToSurveyGraph =
      this.removeQuestionnaireToSurveyGraph.bind(this);
  }
  getQIds() {
    return [...new Set(this.state.originalGraphData.map((item) => item.qid))];
  }
  getLineAttributesByQId(qid) {
    const qids = this.getQIds();
    const lineAttributes = qids.map((qid, index) => {
      return {
        id: qid,
        props: getLineAttributes(qid, "", index),
      };
    });
    const matched = lineAttributes.filter((item) => item.id === qid);
    if (matched.length) return matched[0].props;
    return defaultLineAttributes;
  }

  isInSurveyGraph(qid) {
    return this.state.graphData.some((item) => item.qid === qid);
  }
  addQuestionnaireToSurveyGraph(qid) {
    if (this.isInSurveyGraph(qid)) return;
    const qData = this.state.originalGraphData.filter(
      (item) => item.qid === qid
    );
    if (qData && qData.length)
      this.setState({
        graphData: [...this.state.graphData, ...qData],
      });
  }
  removeQuestionnaireToSurveyGraph(qid) {
    if (!this.isInSurveyGraph(qid)) return;
    this.setState({
      graphData: this.state.graphData.filter((item) => item.qid !== qid),
    });
  }

  compareDate(a, b) {
    let calcA = new Date(a[xFieldName]).getTime();
    let calcB = new Date(b[xFieldName]).getTime();
    if (calcA > calcB) return 1;
    if (calcB > calcA) return -1;
    return 0;
  }

  renderLegend() {
    const qids = this.getQIds();
    return (
      <div className="legend">
        {qids.map((item, index) => (
          <div className="legend__item" key={`legend_${item}_${index}`}>
            <div>
              <span
                className="icon"
                style={{
                  backgroundColor: this.getLineAttributesByQId(item).strokeColor,
                }}
              ></span>
              <span>{item.toUpperCase()}</span>
            </div>
            <div className="select-icons-container print-hidden">
              <button
                className="select-icon plus"
                onClick={() => this.addQuestionnaireToSurveyGraph(item)}
                disabled={this.isInSurveyGraph(item) ? true : false}
                title={`Add ${item} to graph`}
              >
                +
              </button>
              <button
                className="select-icon minus"
                onClick={() => this.removeQuestionnaireToSurveyGraph(item)}
                disabled={this.isInSurveyGraph(item) ? false : true}
                title={`Remove ${item} from graph`}
              >
                -
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  componentDidMount() {
    this.setState({
      graphData: this.props.data,
      originalGraphData: this.props.data,
    });
  }

  render() {
    //let propData = this.state.graphData || [];
    //make a copy of the data so as not to accidentally mutate it
    //need to make sure the dates are sorted for line to draw correctly
    let data = this.state.graphData
      ? this.state.graphData.map((item) => {
          return {
            ...item,
          };
        })
      : [];
    let noEntry = !this.state.graphData || !this.state.graphData.length;
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
      const yr = item.getFullYear();
      const my = item.getMonth() + 1 + "-" + yr;
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
    const timeDiff = (maxDate.getTime() - minDate.getTime()) / 1000;
    const monthsDiff = Math.abs(Math.round(timeDiff / (60 * 60 * 24 * 7 * 4)));
    // console.log("month diff between years ", monthsDiff);

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
      right: 16,
      bottom: 88,
      left: 64,
    };
    const parentWidth = 540;
    const parentHeight = 396;
    const width = parentWidth - margins.left - margins.right;
    const height = parentHeight - margins.top - margins.bottom;
    const xScale = scaleTime()
      .domain([baseLineDate, maxDate])
      .rangeRound([0, width]);
    const yMaxValue = d3.max(data, (d) => (d.maxScore ? d.maxScore : d.score));
    const yScale = scaleLinear()
      .domain([0, yMaxValue + 10])
      .range([height, 0])
      .nice();

    const lineGenerator = line()
      .x((d) => xScale(d[xFieldName]))
      .y((d) => yScale(d[yFieldName]));

    const defaultLineProps = {
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

    const tickInterval = (() => {
      if (monthsDiff >= 84) return 7;
      if (monthsDiff >= 72) return 6;
      if (monthsDiff >= 60) return 5;
      if (monthsDiff >= 48) return 4;
      if (monthsDiff >= 36) return 3;
      if (monthsDiff > 12) return 2;
      return 1;
    })();

    const xSettings = {
      scale: xScale,
      orient: "bottom",
      transform: `translate(0, ${height})`,
      tickFormat: "%b %Y",
      tickType: "date",
      tickInterval: tickInterval,
    };
    const ySettings = {
      scale: yScale,
      orient: "left",
      transform: "translate(0, 0)",
      ticks: 10,
    };

    const graphWidth = width + margins.left + margins.right;
    const graphHeight = height + margins.top + margins.bottom;

    //use .nest()function to group data so the line can be computed for each group

    // Nest the entries by symbol
    let dataNest = d3
      .nest()
      .key(function (d) {
        return d.qid;
      })
      .entries(data);
    //console.log("survey graph data nest ", dataNest);

    const renderYGrid = () => (
      <Grid
        {...{
          width: width,
          height: height,
          numTicks: 5,
          orientation: "left",
        }}
      ></Grid>
    );

    const renderXGrid = () => (
      <Grid
        {...{
          width: width,
          height: height,
          numTicks: 10,
          orientation: "bottom",
        }}
      ></Grid>
    );

    const renderYAxisLabel = () => {
      const labelProps = {
        transform: "rotate(-90)",
        y: 0 - margins.left + 4,
        x: 0 - graphHeight / 2,
        dy: "1em",
      };
      return (
        <text className="axis-label" {...labelProps}>
          Value / Score
        </text>
      );
    };

    const renderLines = () => {
      return dataNest.map((data, index) => {
        return (
          <Line
            key={`line-${data.key}-${index}`}
            lineID={`dataLine_${data.key}`}
            data={data.values}
            {...{
              ...defaultLineProps,
              ...this.getLineAttributesByQId(data.key),
            }}
          />
        );
      });
    };

    if (noEntry)
      return (
        <React.Fragment>
          <div className="no-entries">
            <b>No graph to show.</b>
          </div>
          {this.state.originalGraphData.length > 0 && this.renderLegend()}
        </React.Fragment>
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
                {renderYGrid()}
                {/* x grid */}
                {renderXGrid()}
                {renderYAxisLabel()}
                {/* x and y axis */}
                <XYAxis {...{ xSettings, ySettings }} />
                {renderLines()}
              </g>
            </svg>
          </div>
        </div>
        {this.state.originalGraphData.length > 0 && this.renderLegend()}
      </React.Fragment>
    );
  }
}

SurveyGraph.propTypes = {
  data: PropTypes.array,
};
