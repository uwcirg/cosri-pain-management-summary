import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
import {
  downloadSVGImage,
  getDifferenceInYears,
  renderImageFromSVG,
} from "../../helpers/utility";

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
      graphData: this.props.data ? this.props.data : [],
      originalGraphData: this.props.data ? this.props.data : [],
      selectedDateRange: this.getScaleInfoForSlider().max,
      qids:
        this.props.data && this.props.data.length
          ? [...new Set(this.props.data.map((item) => item.qid))]
          : [],
    };
    this.downloadButtonRef = React.createRef();
    // This binding is necessary to make `this` work in the callback
    this.addQuestionnaireToSurveyGraph =
      this.addQuestionnaireToSurveyGraph.bind(this);
    this.removeQuestionnaireToSurveyGraph =
      this.removeQuestionnaireToSurveyGraph.bind(this);
    this.showDownloadButton = this.showDownloadButton.bind(this);
    this.hideDownloadButton = this.hideDownloadButton.bind(this);
    this.handleDateRangeChange = this.handleDateRangeChange.bind(this);
    this.graphRef = React.createRef();
    this.printImageRef = React.createRef();
  }
  componentDidMount() {
    setTimeout(
      () =>
        renderImageFromSVG(this.printImageRef.current, this.graphRef.current),
      1000
    );
  }
  shouldShowAccessories() {
    return this.state.originalGraphData.length > 0;
  }
  getNumYearsFromData(dataSource) {
    if (!dataSource || !dataSource.length) return 0;
    let arrayDates = dataSource.map((d) => {
      return new Date(d[xFieldName]);
    });
    if (arrayDates.length) {
      const minDate = new Date(Math.min.apply(null, arrayDates));
      if (isNaN(minDate)) return 0;
      // const diffYears = parseFloat(
      //   maxDate.getFullYear() - minDate.getFullYear()
      // );
      // if (!diffYears) {
      //   const getDifferenceInMonth = (dateFrom, dateTo) => {
      //     return (
      //       dateTo.getMonth() -
      //       dateFrom.getMonth() +
      //       12 * (dateTo.getFullYear() - dateFrom.getFullYear())
      //     );
      //   };
      //   const monthDiff = getDifferenceInMonth(minDate, maxDate);

      //   return monthDiff > 0 ? monthDiff / 12 : 1;
      // }
      const numYears = getDifferenceInYears(minDate, new Date());
      return numYears.toFixed(1);
    }
    return 0;
  }
  showDownloadButton() {
    this.downloadButtonRef.current.style.display = "block";
  }
  hideDownloadButton() {
    this.downloadButtonRef.current.style.display = "none";
  }
  getDataForGraph(dataSource) {
    let baseLineDate = new Date();
    let maxDate = new Date();
    let minDate = new Date().setDate(maxDate.getDate() - 365);
    //make a copy of the data so as not to accidentally mutate it
    //need to make sure the dates are sorted for line to draw correctly
    let data = dataSource
      ? dataSource.map((item) => {
          return {
            ...item,
          };
        })
      : [];
    data = data.filter(
      (d) => d[xFieldName] && d[yFieldName] !== null && !isNaN(d[yFieldName])
    );

    const years = this.getSelectedDateRange(this.state.selectedDateRange);
    data = this.getFilteredDataByNumYears(data, years);
    data = this.getFilteredDataByQids(data);

    data = data.map((d) => {
      let dObj = new Date(d[xFieldName]);
      let tzOffset = dObj.getTimezoneOffset() * 60000;
      dObj.setTime(dObj.getTime() + tzOffset);
      d[xFieldName] = dObj;
      return d;
    });

    data.forEach((item) => {
      item[yFieldName] = isNaN(item[yFieldName]) ? 0 : +item[yFieldName];
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
    //if (arrMonthsYears.length < 4) {
    /*
     * make sure graph has appropiate end points on the graph
     * if the total count of data points is less than the initial set number of intervals
     */
    let calcMinDate = new Date(minDate.valueOf());
    minDate = calcMinDate.setDate(
      calcMinDate.getDate() - 30 * this.state.selectedDateRange
    );
    minDate = new Date(minDate);
    //console.log("min date ", minDate, " max date ", maxDate)
    //}
    const timeDiff = (maxDate.getTime() - minDate.getTime()) / 1000;
    const monthsDiff = Math.abs(Math.round(timeDiff / (60 * 60 * 24 * 7 * 4)));
    // console.log("month diff between years ", monthsDiff);

    if (arrayDates.length) {
      /*
       * set up baseline data point starting at 0
       */
      // new Date(minDate.valueOf()).getTime() - 30 * 24 * 60 * 60 * 1000
      baseLineDate.setTime(
        new Date(minDate.valueOf()).getTime() - 15 * 24 * 60 * 60 * 1000
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
    return {
      data: data,
      baseLineDate: baseLineDate,
      maxDate: maxDate,
      minDate: minDate,
      monthsDiff: monthsDiff,
    };
  }
  getQIds() {
    let srcData = this.state.originalGraphData.filter(
      (item) =>
        item[xFieldName] &&
        item[yFieldName] !== null &&
        !isNaN(item[yFieldName])
    );
    return [...new Set(srcData.map((item) => item.qid))];
  }
  getFilteredDataByQids(dataSource) {
    if (!dataSource) return null;
    const qids =
      this.state.qids && this.state.qids.length ? this.state.qids : null;
    if (qids) {
      return dataSource.filter((item) => {
        return this.state.qids.indexOf(item.qid) !== -1;
      });
    }
    return dataSource;
  }
  getLineAttributesByQId(qid) {
    const qids = this.getQIds();
    const lineAttributes = qids.map((qid, index) => {
      return {
        id: qid,
        props: getLineAttributes(qid, null, index),
      };
    });
    const matched = lineAttributes.filter((item) => item.id === qid);
    if (matched.length) return matched[0].props;
    return defaultLineAttributes;
  }

  getFilteredDataByNumYears(dataSource, numYears) {
    if (!dataSource) return null;
    if (numYears == null || isNaN(numYears)) return dataSource;
    return dataSource.filter((item) => {
      const itemDate = new Date(item[xFieldName]);
      if (isNaN(itemDate)) return false;
      const today = new Date();
      const diffYears = getDifferenceInYears(itemDate, today);
      return diffYears.toFixed(1) <= parseFloat(numYears).toFixed(1);
    });
  }

  isInSurveyGraph(qid) {
    return this.state.graphData.find((item) => item.qid === qid);
  }
  isSurveyInDateRange(qid) {
    const qData = this.state.originalGraphData.filter(
      (item) => item.qid === qid
    );
    const filteredData = this.getFilteredDataByNumYears(
      qData,
      this.state.selectedDateRange
    );
    return filteredData && filteredData.length > 0;
  }
  addQuestionnaireToSurveyGraph(qid) {
    if (this.isInSurveyGraph(qid)) return;
    const qData = this.state.originalGraphData.filter(
      (item) => item.qid === qid
    );
    if (qData && qData.length) {
      const updatedData = [...this.state.graphData, ...qData];
      this.setState({
        graphData: updatedData,
        qids: [...new Set(updatedData.map((item) => item.qid))],
      });
    }
  }
  removeQuestionnaireToSurveyGraph(qid) {
    if (!this.isInSurveyGraph(qid)) return;
    const updatedData = this.state.graphData.filter((item) => item.qid !== qid);
    this.setState({
      graphData: updatedData,
      qids: [...new Set(updatedData.map((item) => item.qid))],
    });
  }

  compareDate(a, b) {
    let calcA = new Date(a[xFieldName]).getTime();
    let calcB = new Date(b[xFieldName]).getTime();
    if (calcA > calcB) return 1;
    if (calcB > calcA) return -1;
    return 0;
  }

  hasOnlyOneGraphLine() {
    const { data } = this.getDataForGraph(this.state.graphData);
    return (
      data &&
      data.length &&
      [...new Set(data.map((item) => item.qid))].length === 1
    );
  }

  getSelectedDateRange(value) {
    // let years = "all";
    // switch (String(value).toLowerCase()) {
    //   case "1 year":
    //     years = 1;
    //     break;
    //   case "2 years":
    //     years = 2;
    //     break;
    //   case "5 years":
    //     years = 5;
    //     break;
    //   default:
    //     break;
    // }
    // return years;
    return parseFloat(value);
  }

  handleDateRangeChange(e) {
    const years = this.getSelectedDateRange(e.target.value);
    let updatedData = this.getFilteredDataByQids(this.state.originalGraphData);
    console.log("data? ", updatedData);
    this.setState({
      graphData: this.getFilteredDataByNumYears(updatedData, years),
      selectedDateRange: e.target.value,
    });
  }

  renderLegend() {
    const qids = this.getQIds();
    const hasOnlyOneGraphLine = this.hasOnlyOneGraphLine();
    return (
      <div className="legend-container">
        <div className="legend">
          {qids.map((item, index) => (
            <div className="legend__item" key={`legend_${item}_${index}`}>
              <div className="legend__item--key">
                <span
                  className="icon"
                  style={{
                    backgroundColor:
                      this.getLineAttributesByQId(item).strokeColor,
                  }}
                ></span>
                <span>{item.toUpperCase()}</span>
              </div>
              {qids.length > 1 && (
                <div className="select-icons-container print-hidden">
                  <button
                    className="select-icon plus"
                    onClick={() => this.addQuestionnaireToSurveyGraph(item)}
                    disabled={
                      this.isInSurveyGraph(item)
                        ? true
                        : this.isSurveyInDateRange(item)
                        ? false
                        : true
                    }
                    title={`Add ${item} to graph`}
                  >
                    show
                  </button>
                  <button
                    className="select-icon minus"
                    onClick={() => this.removeQuestionnaireToSurveyGraph(item)}
                    disabled={
                      hasOnlyOneGraphLine
                        ? true
                        : this.isInSurveyGraph(item)
                        ? false
                        : true
                    }
                    title={`Remove ${item} from graph`}
                  >
                    hide
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  renderPrintOnlyImage() {
    return (
      <img
        ref={this.printImageRef}
        alt="for print"
        className="print-image"
        style={{ zIndex: -1, position: "absolute" }}
      ></img>
    );
  }

  renderDownloadButton() {
    return (
      <button
        ref={this.downloadButtonRef}
        onClick={(e) =>
          downloadSVGImage(e, this.graphRef.current, null, "survey_graph")
        }
        className="print-hidden button-default rounded"
        style={{
          fontSize: "0.9rem",
          position: "absolute",
          color: "#777",
          zIndex: 20,
          top: "24px",
          right: "24px",
          minWidth: "48px",
          display: "none",
          backgroundColor: "transparent",
        }}
        title="download graph"
      >
        <FontAwesomeIcon
          icon="download"
          title="Download graph"
        ></FontAwesomeIcon>{" "}
      </button>
    );
  }

  renderPrintOnlyDateRange() {
    return <h4 className="print-only">Last 2 years</h4>;
  }

  renderDateRangeSelector() {
    const items = [
      {
        key: "Last 1 year",
        value: "1 year",
      },
      {
        key: "Last 2 years",
        value: "2 years",
      },
      {
        key: "Last 5 years",
        value: "5 years",
      },
      {
        key: "All",
        value: "all",
      },
    ];
    return (
      <div className="select print-hidden">
        <select
          value={this.state.selectedDateRange}
          onChange={this.handleDateRangeChange}
          onBlur={this.handleDateRangeChange}
        >
          {items.map((item, index) => {
            return (
              <option key={`graph_date_option_${index}`} value={item.value}>
                {item.key}
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  getScaleInfoForSlider() {
    const numYears = this.getNumYearsFromData(this.props.data);
    const defaultMaxValue = numYears && numYears > 0 ? numYears : 0;
    const createArray = (N) => {
      return [...Array(N).keys()].map((i) => i + 1);
    };
    const getArrMonths = () => {
      const arrMonths = [0.25, 0.5, 0.75, 1];
      const arrDiffYears = this.props.data
        .filter((item) => {
          const itemDate = new Date(item[xFieldName]);
          if (isNaN(itemDate)) return false;
          return true;
        })
        .map((item) => {
          const today = new Date();
          const itemDate = new Date(item[xFieldName]);
          return getDifferenceInYears(itemDate, today);
        });
      return arrMonths.filter((m) => {
        return m > arrDiffYears[0];
      });
    };
    const arrNum =
      defaultMaxValue > 1
        ? createArray(Math.round(defaultMaxValue))
        : getArrMonths();
    return {
      arrNum: arrNum,
      min: arrNum.length ? arrNum[0] : 0,
      max: arrNum.length ? arrNum[arrNum.length - 1] : 0,
      unit: defaultMaxValue > 1 ? "year" : "month",
    };
  }

  renderSlider() {
    // const numYears = this.getNumYearsFromData(this.state.originalGraphData);
    // const defaultMaxValue = numYears && numYears > 0 ? numYears : 0;
    // const createArray = (N) => {
    //   return [...Array(N).keys()].map((i) => i + 1);
    // };
    // const getArrMonths = () => {
    //   const arrMonths = [0.25, 0.5, 0.75, 1];
    //   const arrDiffYears = this.state.originalGraphData
    //     .filter((item) => {
    //       const itemDate = new Date(item[xFieldName]);
    //       if (isNaN(itemDate)) return false;
    //       return true;
    //     })
    //     .map((item) => {
    //       const today = new Date();
    //       const itemDate = new Date(item[xFieldName]);
    //       return getDifferenceInYears(itemDate, today);
    //     });
    //   return arrMonths.filter((m) => {
    //     return m > arrDiffYears[0];
    //   });
    // };
    // const arrNum =
    //   defaultMaxValue > 1
    //     ? createArray(Math.round(defaultMaxValue))
    //     : getArrMonths();
    const { arrNum, unit } = this.getScaleInfoForSlider();
    const selectedRange = parseFloat(this.state.selectedDateRange);
    // console.log("numYears ", numYears);
    console.log("selected ", selectedRange);
    console.log("arrNum ", arrNum);
    const inYears = unit === "year";
    // console.log("max value ", defaultMaxValue);
    const getDisplayDateRange = () => {
      if (selectedRange <= 1) {
        if (inYears) return "Last 1 year";
        return `Last ${Math.round(selectedRange * 12)} months`;
      }
      if (selectedRange % 1 === 0)
        return `Last ${selectedRange.toFixed(0)} years`;
      const numMonths = Math.floor(
        (selectedRange - Math.floor(selectedRange)) * 12
      );
      const monthsDisplay = numMonths ? numMonths + " months" : "";
      return `Last ${Math.floor(selectedRange)} year${
        Math.floor(selectedRange) <= 1 ? "" : "s"
      } ${monthsDisplay}`;
    };
    if (arrNum.length <= 1) return null;
    return (
      <div className="slider-parent-container">
        <div className="top-info-text">{getDisplayDateRange()}</div>
        <div className="slider-container">
          <input
            type="range"
            id="slider"
            min={arrNum[0]}
            max={arrNum[arrNum.length - 1]}
            step={0.01}
            defaultValue={arrNum[arrNum.length - 1]}
            className="slider"
            onChange={this.handleDateRangeChange}
          />
          <div className="scale">
            {arrNum.map((item, index) => (
              <span key={`scale_${index}`}>{!inYears ? item * 12 : item}</span>
            ))}
          </div>
        </div>
        <div className="bottom-info-text">
          {`date range (in ${!inYears ? "months" : "years"})`}
        </div>
      </div>
    );
  }
  render() {
    const noEntry =
      !this.state.originalGraphData || !this.state.originalGraphData.length;

    const noStateEntry = !this.state.graphData || !this.state.graphData.length;

    const { data, maxDate, baseLineDate, monthsDiff } = this.getDataForGraph(
      this.state.graphData
    );

    const margins = {
      top: 32,
      right: 16,
      bottom: 72,
      left: 56,
    };
    const parentWidth = 540;
    // 396
    const parentHeight = 508;
    const width = parentWidth - margins.left - margins.right;
    const height = parentHeight - margins.top - margins.bottom;
    const xScale = scaleTime()
      .domain([baseLineDate, maxDate])
      .rangeRound([0, width])
      .nice();
    const yMaxValue = d3.max(data, (d) => (d.maxScore ? d.maxScore : d.score));
    const yScale = scaleLinear().domain([0, yMaxValue]).range([height, 0]);
    //.nice();

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
      ticks: yMaxValue,
      className: this.hasOnlyOneGraphLine() ? "show-max-min-labels" : "",
    };

    const graphWidth = width + margins.left + margins.right;
    const graphHeight = height + margins.top + margins.bottom;

    //use .nest()function to group data so the line can be computed for each group

    // Nest the entries by symbol
    const getDataNest = (data) =>
      d3
        .nest()
        .key(function (d) {
          return d.qid;
        })
        .entries(data);
    //console.log("survey graph data nest ", getDataNest(data));

    const renderYGrid = () => (
      <Grid
        {...{
          width: width,
          height: height,
          numTicks: 6,
          orientation: "left",
        }}
      ></Grid>
    );

    const renderXGrid = () => (
      <Grid
        {...{
          width: width,
          height: height,
          numTicks: 8,
          orientation: "bottom",
        }}
      ></Grid>
    );

    const valueLabelProps = {
      dy: "1em",
      fontSize: "0.65rem",
      fontWeight: 600,
    };

    const renderMaxYValueLabel = () => {
      const labelProps = {
        ...valueLabelProps,
        y: 0 - Math.ceil(margins.top / 2) - 10,
        x: 0 - Math.ceil(margins.left / 2) - 12,
        fill: "red",
      };
      return <text {...labelProps}>Worse</text>;
    };

    const renderMinYValueLabel = () => {
      const labelProps = {
        ...valueLabelProps,
        y: 0 - Math.ceil(margins.top / 2) + graphHeight - margins.bottom - 4,
        x: 0 - Math.ceil(margins.left / 2) - 12,
        fill: "green",
      };
      return <text {...labelProps}>Better</text>;
    };

    const renderYAxisLabel = () => {
      const labelProps = {
        transform: "rotate(-90)",
        y: 0 - margins.left,
        x: 0 - graphHeight / 2,
        dy: "1em",
        fontSize: "14px",
        fontWeight: 600,
        fill: "currentcolor",
      };
      return <text {...labelProps}>Value / Score</text>;
    };

    const renderLines = (props) => {
      const { data } = this.getDataForGraph(this.state.graphData);
      return getDataNest(data).map((o, index) => {
        return (
          <Line
            key={`line-${o.key}-${index}`}
            lineID={`dataLine_${o.key}`}
            data={o.values}
            showPrintLabel={true}
            {...props}
            {...{
              ...defaultLineProps,
              ...this.getLineAttributesByQId(o.key),
            }}
          />
        );
      });
    };

    const renderGraph = () => {
      return (
        <svg
          ref={this.graphRef}
          className="surveyChartSvg print-hidden"
          width="100%"
          height="100%"
          viewBox={`0 0 ${graphWidth} ${graphHeight}`}
          style={{
            fontFamily: "Open Sans, Arial, sans-serif",
          }}
        >
          <g transform={`translate(${margins.left}, ${margins.top})`}>
            {/* y grid */}
            {renderYGrid()}
            {/* x grid */}
            {renderXGrid()}
            {renderYAxisLabel()}
            {this.hasOnlyOneGraphLine() && renderMaxYValueLabel()}
            {this.hasOnlyOneGraphLine() && renderMinYValueLabel()}
            {/* x and y axis */}
            <XYAxis {...{ xSettings, ySettings }} />
            {/* lines drawn for screen display ONLY */}
            {renderLines({
              className: "print-hidden",
            })}
          </g>
        </svg>
      );
    };

    if (noEntry)
      return (
        <React.Fragment>
          <div className="no-entries">
            <b>No graph to show.</b>
          </div>
          {this.shouldShowAccessories() && this.renderLegend()}
        </React.Fragment>
      );

    return (
      <React.Fragment>
        <div
          className="survey-graph"
          style={{ position: "relative" }}
          onMouseEnter={this.showDownloadButton}
          onMouseLeave={this.hideDownloadButton}
        >
          {noStateEntry && (
            <div
              className="flex flex-center text-warning"
              style={{ minHeight: height + margins.bottom + 8, background: "#f4f5f6" }}
            >
              <FontAwesomeIcon icon="exclamation-circle" title="notice" />
              <div>{`No data for ${this.state.qids.join(
                ", "
              )} within this date range`}</div>
            </div>
          )}
          {!noStateEntry && (
            <div className="survey-svg-container">{renderGraph()}</div>
          )}
          {this.renderPrintOnlyImage()}
          {this.renderDownloadButton()}
        </div>
        {this.shouldShowAccessories() && (
          <React.Fragment>
            {this.renderSlider()}
            <div className="flex flex-gap-1">{this.renderLegend()}</div>
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}

SurveyGraph.propTypes = {
  data: PropTypes.array,
};
