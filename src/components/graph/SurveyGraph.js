import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as d3 from "d3";
import { scaleLinear, scaleTime } from "d3-scale";
import { line } from "d3-shape";
import XYAxis from "./xy-axis";
import Grid from "./grid";
import Line from "./line";
import Tooltip from "./tooltip";
import {
  defaultLineAttributes,
  getLineAttributes,
} from "../../config/graph_config";
import {
  allowCopyImage,
  //  copySVGImage,
  copyDomToClipboard,
  // downloadSVGImage,
  downloadDomImage,
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
    this.graphContainerRef = React.createRef();
    this.utilButtonsContainerRef = React.createRef();
    this.scaleLabelRefs = [];
    this.switchCheckboxRefs = [];
    this.copyImageOptions = {
      filter: (node) => {
        const exclusionClasses = ["exclude-from-copy"];
        return !exclusionClasses.some((classname) =>
          node.classList?.contains(classname)
        );
      },
      beforeCopy: () => this.beforeCopy(),
      afterCopy: () => this.afterCopy(),
      beforeDownload: () => this.beforeCopy(),
      afterDownload: () => this.afterCopy(),
    };
    //console.log("graph data ", this.state.graphData);

    // This binding is necessary to make `this` work in the callback
    this.addQuestionnaireToSurveyGraph =
      this.addQuestionnaireToSurveyGraph.bind(this);
    this.removeQuestionnaireToSurveyGraph =
      this.removeQuestionnaireToSurveyGraph.bind(this);
    this.showUtilButtons = this.showUtilButtons.bind(this);
    this.hideUtilButtons = this.hideUtilButtons.bind(this);
    this.handleDateRangeChange = this.handleDateRangeChange.bind(this);
    this.handleSwitchChange = this.handleSwitchChange.bind(this);
    this.graphRef = React.createRef();
    this.printImageRef = React.createRef();
    this.dateRangeSelectorRef = React.createRef();
    this.utilButtonStyle = {
      fontSize: "0.9rem",
      //   position: "absolute",
      color: "#777",
      //    zIndex: 20,
      //   top: "16px",
      //    right: "16px",
      minWidth: "48px",
      //   display: "none",
      backgroundColor: "transparent",
    };
  }
  componentDidMount() {
    this.createScaleRefs();
    setTimeout(() => {
      renderImageFromSVG(this.printImageRef.current, this.graphRef.current);
    }, 1000);
  }
  initSwitchCheckboxRefs() {
    // Initialize the array with React.createRef() objects
    for (let i = 0; i < this.state.qids.length; i++) {
      this.switchCheckboxRefs.push(React.createRef());
    }
  }
  createScaleRefs() {
    // Initialize the array with React.createRef() objects
    for (let i = 0; i < this.state.selectedDateRange * 12 * 30; i++) {
      this.scaleLabelRefs.push(React.createRef());
    }
  }
  shouldShowAccessories() {
    return this.state.originalGraphData.length > 0;
  }
  getNumYearsFromData(dataSource) {
    if (!dataSource || !dataSource.length) return 0;
    let arrayDates = dataSource
      .filter((d) => !isNaN(new Date(d[xFieldName])))
      .map((d) => {
        return new Date(d[xFieldName]);
      });
    if (arrayDates.length) {
      const minDate = new Date(Math.min.apply(null, arrayDates));
      if (isNaN(minDate)) return 0;
      const numYears = getDifferenceInYears(minDate, new Date());
      return numYears.toFixed(2);
    }
    return 0;
  }
  showUtilButtons() {
    this.utilButtonsContainerRef.current.style.display = "flex";
  }
  hideUtilButtons() {
    this.utilButtonsContainerRef.current.style.display = "none";
  }
  getDataForGraph(dataSource) {
    let baseLineDate = new Date();
    let maxDate = new Date();
    let minDate = new Date();
    //let minDate = new Date().setDate(maxDate.getDate() - 365);
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

    data.filter((item) => !isNaN(item[xFieldName]));

    const arrDates = data.map((item) => item[xFieldName]);
    minDate = new Date(Math.min(...arrDates.map((d) => d.getTime())));
    minDate = new Date(minDate.setDate(minDate.getDate() - 30));
    const timeDiff = (maxDate.getTime() - minDate.getTime()) / 1000;
    const monthsDiff = Math.abs(Math.round(timeDiff / (60 * 60 * 24 * 7 * 4)));

    baseLineDate.setTime(new Date(minDate.valueOf()).getTime());
    baseLineDate = new Date(baseLineDate.setDate(baseLineDate.getDate() - 30));
    let calcMaxDate = new Date(maxDate.valueOf());
    maxDate = calcMaxDate.setDate(calcMaxDate.getDate() + 30);
    maxDate = !(maxDate instanceof Date) ? new Date(maxDate) : maxDate;
    // console.log(
    //   "min date ",
    //   minDate,
    //   " max date ",
    //   maxDate,
    //   " baseline ",
    //   baseLineDate
    // );
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
    return parseFloat(value);
  }

  updateScale() {
    this.scaleLabelRefs.forEach((ref) => {
      if (!ref.current) return;
      const labelValue = parseFloat(ref.current.getAttribute("datavalue"));
      const labelUnit = ref.current.getAttribute("dataunit");
      const diff = Math.abs(this.state.selectedDateRange - labelValue);
      const comparisonValue = labelUnit === "year" ? 0.05 : 0.001;
      // console.log(
      //   "label value ",
      //   labelValue,
      //   " selected ",
      //   this.state.selectedDateRange,
      //   " diff ",
      //   diff
      // );
      if (diff <= comparisonValue) {
        ref.current.classList.add("active");
      } else {
        ref.current.classList.remove("active");
      }
    });
  }

  handleSwitchChange(e) {
    const itemValue = e.target.value;
    if (e.target.checked) {
      this.addQuestionnaireToSurveyGraph(itemValue);
    } else {
      this.removeQuestionnaireToSurveyGraph(itemValue);
    }
  }

  handleDateRangeChange(e) {
    const selectedValue = e.target.value;
    const years = this.getSelectedDateRange(selectedValue);
    let updatedData = this.getFilteredDataByQids(this.state.originalGraphData);
    this.setState(
      {
        graphData: this.getFilteredDataByNumYears(updatedData, years),
        selectedDateRange: selectedValue,
      },
      this.updateScale
    );
  }

  beforeCopy() {
    this.dateRangeSelectorRef.current.classList.add("read-only");
  }
  afterCopy() {
    this.dateRangeSelectorRef.current.classList.remove("read-only");
  }

  renderLegend() {
    const qids = this.getQIds();
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
                <span className="text">{item.toUpperCase()}</span>
              </div>
              {qids.length > 1 && (
                <div className="select-icons-container print-hidden">
                  <label
                    className={`exclude-from-copy switch ${
                      !this.isSurveyInDateRange(item) ? "disabled" : ""
                    }`}
                    title={
                      this.isInSurveyGraph(item)
                        ? `Remove ${item} from graph`
                        : `Add ${item} to graph`
                    }
                  >
                    <input
                      type="checkbox"
                      value={item}
                      onChange={this.handleSwitchChange}
                      disabled={
                        !this.isSurveyInDateRange(item) ||
                        (this.isInSurveyGraph(item) &&
                          this.hasOnlyOneGraphLine())
                      }
                      ref={this.switchCheckboxRefs[index]}
                      checked={this.isInSurveyGraph(item)}
                    />
                    <span className="switch-slider round"></span>
                  </label>
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
        style={{ zIndex: -1, position: "absolute", width: "100%" }}
      ></img>
    );
  }

  renderDownloadButton() {
    return (
      <button
        // onClick={(e) =>
        //   downloadSVGImage(
        //     e,
        //     this.graphRef.current,
        //     null,
        //     `survey_graph_${this.getDisplayDateRange()}`
        //   )
        // }
        onClick={(e) => {
          let options = this.copyImageOptions;
          const containerHeight =
            this.graphContainerRef.current.offsetHeight - 64; // minus the height of the slider
          options.height = containerHeight;
          downloadDomImage(
            e,
            this.graphContainerRef.current,
            `survey_graph_${this.getDisplayDateRange()}`,
            options
          );
        }}
        className="print-hidden button-default rounded"
        style={this.utilButtonStyle}
        title="download graph"
      >
        <FontAwesomeIcon icon="download"></FontAwesomeIcon>
      </button>
    );
  }

  renderCopyButton() {
    if (!allowCopyImage())
      return (
        <div className="print-hidden">
          <FontAwesomeIcon
            className="text-warning"
            icon="exclamation-triangle"
            data-for={"graphWarningTooltip"}
            data-tip
          />
          <ReactTooltip
            className="summary-tooltip"
            id={"graphWarningTooltip"}
            aria-haspopup="true"
          >
            <p>
              If you want to copy this image, please try a different browser.
              <br />
              This browser does not support copying of this image.
            </p>
          </ReactTooltip>
        </div>
      );
    return (
      <button
        //   onClick={(e) => copySVGImage(e, this.graphRef.current, "survey_graph")}
        onClick={() => {
          let options = this.copyImageOptions;
          const containerHeight =
            this.graphContainerRef.current.offsetHeight - 64; // minus the height of the slider
          options.height = containerHeight;
          copyDomToClipboard(this.graphContainerRef.current, options);
        }}
        className="print-hidden button-default rounded"
        style={this.utilButtonStyle}
        title="copy graph"
      >
        <FontAwesomeIcon icon="copy"></FontAwesomeIcon>
      </button>
    );
  }

  renderPrintOnlyDateRange() {
    return <h4 className="print-only">Last 2 years</h4>;
  }

  renderDateRangeSelector() {
    const items = [
      {
        key: this.getDisplayDateRange(),
        value: this.state.selectedDateRange,
      },
      {
        key: "Last 6 months",
        value: 0.5,
      },
      {
        key: "Last 9 months",
        value: 0.75,
      },
      {
        key: "Last 1 year",
        value: 1,
      },
      {
        key: "Last 2 years",
        value: 2,
      },
      {
        key: "Last 5 years",
        value: 5,
      },
    ];

    if (this.getScaleInfoForSlider().max >= 10) {
      items.push({
        key: "Last 10 years",
        value: 10,
      });
    }
    return (
      <div className="select print-hidden" ref={this.dateRangeSelectorRef}>
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
    const arrYears = createArray(Math.ceil(defaultMaxValue));
    const createArrayInMonths = () => {
      let arrNum = [];
      for (
        let i = arrYears[0] * 12;
        i <= arrYears[arrYears.length - 1] * 12;
        i++
      ) {
        if (i % 12 === 0) arrNum.push(i / 12);
        else {
          arrNum.push(Math.floor(i / 12) + (i / 12 - Math.floor(i / 12)));
        }
      }
      return arrNum;
    };
    const getArrMonths = () => {
      const arrMonths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
        (n) => n / 12
      );
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
        return m >= arrDiffYears[0].toFixed(2);
      });
    };
    const arrAllNum = [
      ...new Set([...getArrMonths(), ...createArrayInMonths(defaultMaxValue)]),
    ].sort((a, b) => a - b);
    const arrNum = defaultMaxValue > 1 ? arrAllNum : getArrMonths();
    return {
      arrNum: arrNum,
      min: arrNum.length ? arrNum[0] : 0,
      max: arrNum.length ? arrNum[arrNum.length - 1] : 0,
      unit: defaultMaxValue > 1 ? "year" : "month",
    };
  }
  getDisplayDateRange() {
    const selectedRange = parseFloat(this.state.selectedDateRange);
    if (selectedRange <= 1) {
      if (selectedRange === 1) {
        return "Last 1 year";
      }
      const AVG_DAYS_IN_MONTH = 30;
      let months = Math.floor(selectedRange * 12);
      const remainingMonths = selectedRange * 12 - months;
      const days = Math.ceil(remainingMonths * AVG_DAYS_IN_MONTH);
      if (days === AVG_DAYS_IN_MONTH) months = months + 1;
      const monthsDisplay = months
        ? months > 1
          ? `${months} months`
          : `${months} month`
        : `~${AVG_DAYS_IN_MONTH} days`;
      const daysDisplay =
        days && days < AVG_DAYS_IN_MONTH
          ? days > 1
            ? `~${days} days`
            : `~${days} day`
          : "";

      return `Last ${monthsDisplay} ${daysDisplay}`;
    }
    const numMonths = Math.round(
      (selectedRange - Math.floor(selectedRange)) * 12
    );
    let years = Math.floor(selectedRange);
    if (numMonths === 12) years = years + 1;
    const monthsDisplay =
      numMonths && numMonths < 12
        ? "~" + numMonths + "  " + (numMonths > 1 ? "months" : "month")
        : "";
    const yearsDisplay = years + " " + (years > 1 ? "years" : "year");
    return `Last ${yearsDisplay} ${monthsDisplay}`;
  }

  renderSlider() {
    const { arrNum, unit } = this.getScaleInfoForSlider();
    // const selectedRange = parseFloat(this.state.selectedDateRange);
    //console.log("number of years total: ", numYears);
    // console.log("selected value: ", selectedRange);
    // console.log("scale ticks: ", arrNum);
    const inYears = unit === "year";
    const min = arrNum[0];
    const max = arrNum[arrNum.length - 1];
    if (arrNum.length <= 1) return null;
    return (
      <div className="slider-parent-container">
        {!inYears && (
          <div className="top-info-text">{this.getDisplayDateRange()}</div>
        )}
        {inYears && (
          <div className="top-info-text">{this.renderDateRangeSelector()}</div>
        )}
        <div className="slider-container exclude-from-copy">
          <input
            type="range"
            id="slider"
            min={min}
            max={max}
            step={"any"}
            value={
              this.state.selectedDateRange ? this.state.selectedDateRange : max
            }
            // defaultValue={arrNum[arrNum.length - 1]}
            className="slider"
            onInput={this.handleDateRangeChange}
            onChange={this.handleDateRangeChange}
          />
          <div className="scale">
            {arrNum.map((item, index) => (
              <span
                key={`scale_${index}`}
                className={`label ${
                  Math.abs(this.state.selectedDateRange - item) < 0.001
                    ? "active"
                    : ""
                } ${inYears && max >= 10 && item && item < 1 ? "rotate" : ""}`}
                ref={this.scaleLabelRefs[index]}
                datavalue={item}
                dataunit={item < 1 ? "month" : "year"}
              >
                {item < 1 || !inYears
                  ? !inYears
                    ? item
                      ? item * 12 + "mo"
                      : item
                    : // : (item / 0.25) % 1 === 0 ? (item*12)+"mo" : ""
                    item === arrNum[0] ||
                      (max < 10 &&
                        item - arrNum[0] > 0.25 &&
                        (item / 0.25) % 1 === 0) ||
                      (max < 10 &&
                        item - arrNum[0] > 0.25 &&
                        (item / 0.5) % 1 === 0) ||
                      (max < 10 &&
                        item - arrNum[0] > 0.25 &&
                        (item / 0.75) % 1 === 0)
                    ? item
                      ? item * 12 + "mo"
                      : item
                    : ""
                  : item % 1 === 0
                  ? item + "yr"
                  : ""}
              </span>
            ))}
          </div>
        </div>
        <div className="bottom-info-text exclude-from-copy">date range</div>
      </div>
    );
  }
  renderUtilButtons() {
    return (
      <div
        ref={this.utilButtonsContainerRef}
        className="flex flex-gap-1 buttons-container exclude-from-copy"
        style={{
          position: "absolute",
          top: 0,
          // left: "64px",
          right: 0,
          //  display: "none",
        }}
      >
        {this.renderCopyButton()}
        {this.renderDownloadButton()}
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
    // const parentWidth = 460;
    // const parentHeight = 508;
    const parentWidth = 480;
    const parentHeight = 440;
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
      // if (monthsDiff >= 114) return 48;
      if (monthsDiff >= 108) return 48;
      if (monthsDiff >= 96) return 16;
      if (monthsDiff >= 84) return 12;
      if (monthsDiff >= 72) return 8;
      if (monthsDiff >= 36) return 4;
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
      ticks: yMaxValue > 50 ? Math.ceil(yMaxValue / 4) : yMaxValue,
      className: this.hasOnlyOneGraphLine()
        ? this.state.graphData &&
          this.state.graphData.length &&
          this.state.graphData[0].comparisonToAlert
          ? this.state.graphData[0].comparisonToAlert === "lower"
            ? "show-max-min-labels-reverse"
            : "show-max-min-labels"
          : ""
        : "",
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
      const targetData = this.state.graphData[0];
      if (!targetData) return null;
      const labelText = targetData.comparisonToAlert
        ? targetData.comparisonToAlert === "lower"
          ? "Better"
          : "Worse"
        : "";
      const labelFill = targetData.comparisonToAlert
        ? targetData.comparisonToAlert === "lower"
          ? "green"
          : "red"
        : "";
      const labelProps = {
        ...valueLabelProps,
        y: 0 - Math.ceil(margins.top / 2) - 10,
        x: 0 - Math.ceil(margins.left / 2) - 12,
        fill: labelFill,
      };
      return <text {...labelProps}>{labelText}</text>;
    };

    const renderMinYValueLabel = () => {
      const targetData = this.state.graphData[0];
      if (!targetData) return null;
      const labelText = targetData.comparisonToAlert
        ? targetData.comparisonToAlert === "lower"
          ? "Worse"
          : "Better"
        : "";
      const labelFill = targetData.comparisonToAlert
        ? targetData.comparisonToAlert === "lower"
          ? "red"
          : "green"
        : "";
      const labelProps = {
        ...valueLabelProps,
        y: 0 - Math.ceil(margins.top / 2) + graphHeight - margins.bottom - 4,
        x: 0 - Math.ceil(margins.left / 2) - 12,
        fill: labelFill,
      };
      return <text {...labelProps}>{labelText}</text>;
    };

    const renderYAxisLabel = () => {
      const labelProps = {
        transform: "rotate(-90)",
        y: 0 - margins.left,
        x: 0 - graphHeight / 2,
        dy: "1em",
        fontSize: "0.725rem",
        fontWeight: 600,
        fill: "currentcolor",
      };
      return <text {...labelProps}>Value / Score</text>;
    };

    const renderLines = (props) => {
      const { data } = this.getDataForGraph(this.state.graphData);
      // console.log("nav width ", document.querySelector(".summary__nav-wrapper").getBoundingClientRect())
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

    const renderToolTips = (props) => {
      const { data } = this.getDataForGraph(this.state.graphData);
      return getDataNest(data).map((o, index) => {
        return (
          <Tooltip
            key={`tooltip-${o.key}-${index}`}
            data={o.values}
            showDataIdInLabel={true}
            {...props}
            {...{
              ...defaultLineProps,
              ...this.getLineAttributesByQId(o.key),
            }}
          />
        );
      });
    };

    const renderNoStateEntry = () => {
      return (
        <div
          className="flex flex-center text-warning"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            background: "#f4f5f64d",
            left: "16px",
          }}
        >
          <FontAwesomeIcon icon="exclamation-circle" title="notice" />
          <div>{`No data for ${this.state.qids.join(
            ", "
          )} within this date range`}</div>
        </div>
      );
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
            backgroundColor: "#FFF",
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
            {renderToolTips()}
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
          style={{ position: "relative", backgroundColor: "#FFF" }}
          ref={this.graphContainerRef}
          //   onMouseEnter={this.showUtilButtons}
          //   onMouseLeave={this.hideUtilButtons}
        >
          <div className="flex">
            <div style={{ position: "relative", width: "100%", gap: "24px" }}>
              {noStateEntry && renderNoStateEntry()}
              <div
                className="survey-svg-container"
                style={{ position: "relative" }}
              >
                {renderGraph()}
              </div>
              {this.shouldShowAccessories() && this.renderSlider()}
            </div>
            <div
              className="flex flex-gap-1"
              style={{ marginTop: (graphHeight / 2) * -1 + "px" }}
            >
              {this.renderUtilButtons()}
              {this.renderLegend()}
            </div>
          </div>
          {this.renderPrintOnlyImage()}
        </div>
      </React.Fragment>
    );
  }
}

SurveyGraph.propTypes = {
  data: PropTypes.array,
};
