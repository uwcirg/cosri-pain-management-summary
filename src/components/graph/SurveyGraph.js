import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as d3 from "d3";
import { scaleLinear, scaleTime } from "d3-scale";
import { line } from "d3-shape";
import XYAxis from "./xy-axis";
import Grid from "./grid";
import Line from "./line";
import Markers from "./markers";
import Tooltip from "./tooltip";
import {
  defaultLineAttributes,
  getLineAttributes,
  MARKER_SHAPES,
} from "../../config/graph_config";
import {
  getDifferenceInYears,
  isNumber,
  renderImageFromSVG,
  toDate,
} from "../../helpers/utility";
import CopyButton from "../CopyButton";

const defaultFields = {
  x: "date",
  y: "score",
};
const xFieldName = defaultFields.x;
const yFieldName = defaultFields.y;
const MAX_ALLOWED_NUM_YEARS = 13;
export default class SurveyGraph extends Component {
  constructor() {
    super(...arguments);
    const initData = this.getInitData();
    this.state = {
      graphData: initData,
      originalGraphData: initData,
      selectedDateRange: this.getScaleInfoForSlider(initData).max,
      qids: this.getDefaultQIds(initData) ?? [],
      copyInProgress: false,
    };
    // This binding is necessary to make `this` work in the callback
    this.addDataLineToSurveyGraph = this.addDataLineToSurveyGraph.bind(this);
    this.removeDataLineFromSurveyGraph =
      this.removeDataLineFromSurveyGraph.bind(this);
    this.showUtilButtons = this.showUtilButtons.bind(this);
    this.hideUtilButtons = this.hideUtilButtons.bind(this);
    this.handleDateRangeChange = this.handleDateRangeChange.bind(this);
    this.handleSwitchChange = this.handleSwitchChange.bind(this);

    // refs
    this.graphContainerRef = React.createRef();
    this.utilButtonsContainerRef = React.createRef();
    this.sliderContainerRef = React.createRef();
    this.scaleLabelRefs = [];
    this.lengendMarkerRefs = [];
    this.switchCheckboxRefs = [];
    this.graphRef = React.createRef();
    this.printImageRef = React.createRef();
    this.dateRangeSelectorRef = React.createRef();
  }
  componentDidMount() {
    this.createScaleRefs();
    this.createLegendMarkerRefs();
    setTimeout(() => {
      this.populateLegendShapes();
      // rendering image for printing
      renderImageFromSVG(this.printImageRef.current, this.graphRef.current);
    }, 1500);
  }

  getInitData() {
    return this.props.data && Array.isArray(this.props.data)
      ? this.props.data.map((d) => {
          d.qid = d.qid ? String(d.qid).toLowerCase() : "";
          return d;
        })
      : [];
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
  createLegendMarkerRefs() {
    for (let i = 0; i < this.state.qids.length; i++) {
      this.lengendMarkerRefs.push(React.createRef());
    }
  }
  shouldShowAccessories() {
    return (
      this.state.originalGraphData && this.state.originalGraphData.length > 0
    );
  }
  shouldShowSlider() {
    return this.getDurationInYears() >= 1 / 12;
  }
  getNumYearsFromData(dataSource) {
    if (!dataSource || !Array.isArray(dataSource) || !dataSource.length)
      return 0;
    let arrayDates = dataSource
      .filter((d) => {
        const itemDate = toDate(d[xFieldName]);
        return !isNaN(itemDate);
      })
      .map((d) => {
        return toDate(d[xFieldName]);
      });
    if (arrayDates.length) {
      const minDate = new Date(Math.min.apply(null, arrayDates));
      return getDifferenceInYears(minDate, new Date());
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
    //make a copy of the data so as not to accidentally mutate it
    //need to make sure the dates are sorted for line to draw correctly
    let data =
      dataSource && Array.isArray(dataSource)
        ? dataSource.map((item) => {
            return {
              ...item,
            };
          })
        : [];
    data = data.filter((d) => {
      const itemDate = toDate(d[xFieldName]);
      const diffYears = getDifferenceInYears(itemDate, new Date());
      return (
        !isNaN(itemDate) &&
        isNumber(d[yFieldName]) &&
        diffYears < MAX_ALLOWED_NUM_YEARS
      );
    });

    const years = this.getSelectedDateRangeInYears(
      this.state.selectedDateRange
    );
    data = this.getFilteredDataByQids(data);
    data = this.getFilteredDataByNumYears(data, years);

    data = data.map((d) => {
      let dObj = toDate(d[xFieldName]);
      let tzOffset = dObj.getTimezoneOffset() * 60000;
      dObj.setTime(dObj.getTime() + tzOffset);
      d[xFieldName] = dObj;
      return d;
    });

    data.forEach((item) => {
      item[yFieldName] = +item[yFieldName];
    });

    const arrDates = data.map((item) => item[xFieldName]);
    minDate = new Date(Math.min(...arrDates.map((d) => d.getTime())));
    if (minDate > maxDate) maxDate = minDate;
    minDate = new Date(minDate.setDate(minDate.getDate() - 30));
    const timeDiff = (maxDate.getTime() - minDate.getTime()) / 1000;
    const monthsDiff = Math.abs(Math.round(timeDiff / (60 * 60 * 24 * 7 * 4)));

    baseLineDate.setTime(new Date(minDate.valueOf()).getTime());
    baseLineDate = new Date(baseLineDate.setDate(baseLineDate.getDate() - 30));
    let calcMaxDate = new Date(maxDate.valueOf());
    maxDate = calcMaxDate.setDate(calcMaxDate.getDate() + 30);
    //maxDate = !(maxDate instanceof Date) ? new Date(maxDate) : maxDate;
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
  getDefaultQIds() {
    let srcData = this.getInitData().filter(
      (item) =>
        !isNaN(toDate(item[xFieldName])) &&
        item[yFieldName] !== null &&
        isNumber(item[yFieldName])
    );
    return Array.from(new Set(srcData.map((item) => item.qid)));
  }
  getFilteredDataByQids(dataSource) {
    if (!dataSource || !Array.isArray(dataSource)) return [];
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
    const qids = this.getDefaultQIds();
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
    if (!dataSource || !Array.isArray(dataSource) || !dataSource.length)
      return [];
    if (!isNumber(numYears)) return dataSource;
    return dataSource.filter((item) => {
      const itemDate = toDate(item[xFieldName]);
      if (isNaN(itemDate)) return false;
      const today = new Date();
      const diffYears = getDifferenceInYears(itemDate, today);
      return diffYears <= +numYears;
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
  addDataLineToSurveyGraph(qid, callback) {
    if (this.isInSurveyGraph(qid)) return;
    const qData = this.state.originalGraphData.filter(
      (item) => item.qid === qid
    );
    if (qData.length) {
      const updatedData = [...this.state.graphData, ...qData];
      this.setState(
        {
          graphData: updatedData,
          qids: [...new Set(updatedData.map((item) => item.qid))],
        },
        callback
      );
    }
  }
  removeDataLineFromSurveyGraph(qid, callback) {
    if (!this.isInSurveyGraph(qid)) return;
    const updatedData = this.state.graphData.filter((item) => item.qid !== qid);
    this.setState(
      {
        graphData: updatedData,
        qids: [...new Set(updatedData.map((item) => item.qid))],
      },
      callback
    );
  }

  hasOnlyOneGraphLine() {
    const { data } = this.getDataForGraph(this.state.graphData);
    return (
      data &&
      Array.isArray(data) &&
      [...new Set(data.map((item) => item.qid))].length === 1
    );
  }

  getSelectedDateRangeInYears(value) {
    return +value;
  }

  updateScale() {
    this.scaleLabelRefs.forEach((ref) => {
      if (!ref.current) return;
      const labelValue = +ref.current.getAttribute("datavalue");
      //  const labelUnit = ref.current.getAttribute("dataunit");
      const diff = Math.abs(this.state.selectedDateRange - labelValue).toFixed(
        2
      );
      //  const comparisonValue = labelUnit === "month" ? (1 / 30).toFixed(2) :  (1 / 12).toFixed(2);
      const comparisonValue = 0.01;
      // console.log(
      //   "label value ",
      //   labelValue,
      //   " selected ",
      //   this.state.selectedDateRange,
      //   " diff ",
      //   diff
      // );
      if (diff < comparisonValue) {
        ref.current.classList.add("active");
      } else {
        ref.current.classList.remove("active");
      }
    });
  }

  handleSwitchChange(e) {
    const itemValue = e.target.value;
    if (e.target.checked) {
      this.addDataLineToSurveyGraph(itemValue, this.handleDateRangeChange);
    } else {
      this.removeDataLineFromSurveyGraph(itemValue, this.handleDateRangeChange);
    }
  }

  handleDateRangeChange(e) {
    const selectedValue =
      e && e.target ? e.target.value : this.state.selectedDateRange;
    if (!selectedValue) return;
    const years = this.getSelectedDateRangeInYears(selectedValue);
    const updatedData = this.getFilteredDataByQids(
      this.state.originalGraphData
    );
    this.setState(
      {
        graphData: this.getFilteredDataByNumYears(updatedData, years),
        selectedDateRange: selectedValue,
      },
      this.updateScale
    );
  }
  getScaleInfoForSlider(dataSource) {
    const sliderData = dataSource ? dataSource : [];
    const numYears = this.getNumYearsFromData(sliderData);
    const defaultMaxValue = numYears && numYears > 1 ? numYears : 0;
    const createArray = (N) => {
      return [...Array(N).keys()].map((i) => i + 1);
    };
    const arrYears = defaultMaxValue
      ? createArray(Math.ceil(defaultMaxValue))
      : null;
    const createArrayInMonths = () => {
      if (!arrYears || !arrYears.length) return [];
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
    const getArrDiffYears = () => {
      return sliderData
        .filter((item) => {
          const itemDate = toDate(item[xFieldName]);
          return !isNaN(itemDate);
        })
        .map((item) => {
          const today = new Date();
          const itemDate = toDate(item[xFieldName]);
          return getDifferenceInYears(itemDate, today);
        });
    };
    const getArrMonths = () => {
      const arrMonths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
        (n) => n / 12
      );
      const arrDiffYears = getArrDiffYears().filter((item) => item > 1);
      if (!arrDiffYears.length) return arrMonths;

      const arrDiffMonths = getArrDiffYears().filter((item) => item < 1);
      return arrMonths.filter((m) => {
        return m >= arrDiffMonths[0];
      });
    };
    const arrAllNum = [
      ...new Set([...getArrMonths(), ...createArrayInMonths(defaultMaxValue)]),
    ].sort((a, b) => a - b);
    const arrNum = numYears > 1 ? arrAllNum : getArrMonths();
    return {
      arrNum: arrNum,
      arrDiffYears: getArrDiffYears(),
      min: arrNum.length ? arrNum[0] : 0,
      max: arrNum.length ? arrNum[arrNum.length - 1] : 0,
      unit: numYears > 1 ? "year" : "month",
    };
  }
  getDurationInYears() {
    const scaleData = this.getScaleInfoForSlider(this.state.originalGraphData);
    const min = Math.min(...scaleData.arrDiffYears);
    const max = Math.max(...scaleData.arrDiffYears);
    // console.log("array ears ", scaleData.arrDiffYears)
    // console.log("min ", min, " max ", max)
    return max - min;
  }
  getDisplayDateRange() {
    const selectedRange = parseFloat(this.state.selectedDateRange);
    if (selectedRange <= 1) {
      if (selectedRange === 1) {
        return "Past 1 year";
      }
      const AVG_DAYS_IN_MONTH = 30;
      let months = Math.floor(selectedRange * 12);
      const remainingMonths = selectedRange * 12 - months;
      const days = Math.round(remainingMonths * AVG_DAYS_IN_MONTH);
      if (days >= AVG_DAYS_IN_MONTH) months = months + 1;
      const monthsDisplay =
        months === 12
          ? "1 year"
          : months
          ? months > 1
            ? `${months} months`
            : `${months} month`
          : "";
      const daysDisplay =
        months === 12
          ? ""
          : days === AVG_DAYS_IN_MONTH
          ? !monthsDisplay
            ? "~ 1 month"
            : ""
          : days && days < AVG_DAYS_IN_MONTH
          ? days > 1
            ? `~ ${days} days`
            : `~ ${days} day`
          : "";
      if (!monthsDisplay && !daysDisplay) return "";

      return `Past ${monthsDisplay} ${daysDisplay}`.trim();
    }
    const numMonths = Math.round(
      (selectedRange - Math.floor(selectedRange)) * 12
    );
    let years = Math.floor(selectedRange);
    if (numMonths >= 12) years = years + 1;
    const monthsDisplay =
      numMonths && numMonths < 12
        ? "~ " + numMonths + "  " + (numMonths > 1 ? "months" : "month")
        : "";
    const yearsDisplay = years + " " + (years > 1 ? "years" : "year");
    return `Past ${yearsDisplay} ${monthsDisplay}`.trim();
  }

  beforeCopy() {
    if (!this.dateRangeSelectorRef.current) return;
    this.dateRangeSelectorRef.current.classList.add("read-only");
  }
  afterCopy() {
    if (!this.dateRangeSelectorRef.current) return;
    this.dateRangeSelectorRef.current.classList.remove("read-only");
  }
  getImageContainerHeight() {
    const PADDING_WIDTH = 36;
    const sliderHeight =
      this.sliderContainerRef.current &&
      this.sliderContainerRef.current.offsetHeight > PADDING_WIDTH
        ? this.sliderContainerRef.current.offsetHeight - PADDING_WIDTH
        : 0;
    const parentContainerHeight =
      this.graphContainerRef.current &&
      this.graphContainerRef.current.offsetHeight
        ? this.graphContainerRef.current.offsetHeight
        : 0;
    return parentContainerHeight && parentContainerHeight > sliderHeight
      ? parentContainerHeight - sliderHeight
      : 0; // minus the height of the slider
  }

  populateLegendShapes() {
    const qids = this.getDefaultQIds();
    qids.forEach((item, index) => {
      const attributes = this.getLineAttributesByQId(item);
      const markerType = attributes.markerType;
      let markerShape = MARKER_SHAPES[markerType];
      if (!markerShape) markerShape = MARKER_SHAPES["circle"];
      var sym = d3.symbol().type(markerShape).size(112);
      d3.select(this.lengendMarkerRefs[index].current)
        .append("path")
        .attr("d", sym)
        .attr("fill", attributes.dataPointsProps.fillColor)
        .attr("stroke-color", attributes.dataPointsProps.strokeColor)
        .attr("transform", "translate(10, 10)");
    });
  }

  renderLegend() {
    const qids = this.getDefaultQIds();
    return (
      <div className="legend-container">
        <div className="legend">
          {qids.map((item, index) => {
            const attributes = this.getLineAttributesByQId(item);
            const markerType = attributes.markerType;
            return (
              <div className="legend__item" key={`legend_${item}_${index}`}>
                <div className="legend__item--key">
                  {/* <span
                    className={`icon ${attributes.markerType}`}
                    style={style}
                  ></span> */}
                  <svg
                    id={`legend_${markerType}_${index}`}
                    width="20"
                    height="20"
                    ref={this.lengendMarkerRefs[index]}
                  ></svg>

                  <span className="text">{item.toUpperCase()}</span>
                </div>
                {qids.length > 1 && (
                  <div className="select-icons-container print-hidden">
                    <label
                      // className={`exclude-from-copy switch ${
                      //   !this.isSurveyInDateRange(item) ? "disabled" : ""
                      // }`}
                      className={`exclude-from-copy switch`}
                      title={
                        this.isInSurveyGraph(item)
                          ? `Remove ${item} from graph`
                          : this.isSurveyInDateRange(item)
                          ? `Add ${item} to graph`
                          : "No data in selected date range"
                      }
                    >
                      <input
                        type="checkbox"
                        value={item}
                        onChange={this.handleSwitchChange}
                        // disabled={
                        //   !this.isSurveyInDateRange(item) ||
                        //   (this.isInSurveyGraph(item) &&
                        //     this.hasOnlyOneGraphLine())
                        // }
                        disabled={
                          this.isInSurveyGraph(item) &&
                          this.hasOnlyOneGraphLine()
                        }
                        ref={this.switchCheckboxRefs[index]}
                        checked={!!this.isInSurveyGraph(item)}
                      />
                      <span className="switch-slider round"></span>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  renderPrintOnlyImage() {
    return (
      <div className="print-only">
        <img
          ref={this.printImageRef}
          alt="for print"
          className="survey-graph print-image"
          style={{ zIndex: -1, position: "absolute", width: "100%" }}
        ></img>
      </div>
    );
  }

  renderCopyButton() {
    return (
      <CopyButton
        elementToCopy={this.graphContainerRef.current}
        buttonTitle="Click to copy longitudinal graph"
        beforeCopy={() => this.beforeCopy()}
        afterCopy={() => this.afterCopy()}
        //    disableFrame={true}
      ></CopyButton>
    );
  }

  renderPrintOnlyDateRange() {
    return <h4 className="print-only">Past 2 years</h4>;
  }

  renderDateRangeSelector() {
    const dateRangeData = this.state.originalGraphData.filter(
      (item) => this.state.qids.indexOf(item.qid) !== -1
    );
    // console.log("date range Data ", dateRangeData)
    const scaleData = this.getScaleInfoForSlider(dateRangeData);
    const maxValue = scaleData.max;
    const minValue = scaleData.min;
    const selectedValue = +this.state.selectedDateRange;
    // console.log(
    //   "max val ",
    //   maxValue,
    //   " min value ",
    //   minValue,
    //   " selected value ",
    //   selectedValue
    // );
    let items = [
      {
        key: "Past 6 months",
        value: 0.5,
      },
      {
        key: "Past 9 months",
        value: 0.75,
      },
      {
        key: "Past 1 year",
        value: 1,
      },
      {
        key: "Past 2 years",
        value: 2,
      },
      {
        key: "Past 5 years",
        value: 5,
      },
      {
        key: "Past 10 years",
        value: 10,
      },
    ].filter((d) => {
      return d.value > minValue && d.value < maxValue;
    });

    if (maxValue >= 1) {
      items.push({
        key: `Past ${maxValue} year${maxValue > 1 ? "s" : ""}`,
        value: maxValue,
      });
    }

    items.unshift({
      key: this.getDisplayDateRange(),
      value: selectedValue,
    });

    const jsonItems = items.map(JSON.stringify);
    const uniqueSet = new Set(jsonItems);
    const itemsToDisplay = Array.from(uniqueSet).map(JSON.parse);

    return (
      <div
        className="select larger print-hidden"
        ref={this.dateRangeSelectorRef}
      >
        <select
          value={selectedValue <= maxValue ? selectedValue : ""}
          onChange={this.handleDateRangeChange}
          onBlur={this.handleDateRangeChange}
        >
          <option value="">Select</option>
          {itemsToDisplay.map((item, index) => {
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

  renderSlider() {
    //console.log("qids ", this.state.qids);
    const sliderData = this.state.originalGraphData.filter(
      (item) => this.state.qids.indexOf(item.qid) !== -1
    );
    const { arrNum, unit } = this.getScaleInfoForSlider(sliderData);
    // console.log("arrNum ", arrNum, " unit ", unit);
    // const selectedRange = parseFloat(this.state.selectedDateRange);
    //console.log("number of years total: ", numYears);
    // console.log("selected value: ", selectedRange);
    // console.log("scale ticks: ", arrNum);
    const inYears = unit === "year";
    const min = arrNum[0];
    const max = arrNum[arrNum.length - 1];
    const arrDisplayValues = arrNum.map((item, index) => {
      const prevItem =
        index > 0
          ? arrNum.find(
              (n, i) =>
                i < index &&
                (i === 0 ||
                  (n < 1 && n % 0.25 === 0) ||
                  (n < 1 && n % 0.5 === 0) ||
                  (n < 1 && n % 0.75 === 0) ||
                  n % 1 === 0)
            )
          : null;
      const shouldDisplay =
        index === 0 ||
        index === arrNum.length - 1 ||
        (prevItem > 1 && item > 1 && item % 1 === 0) ||
        (prevItem && item - prevItem > 0.085);
      // console.log(
      //   "item ",
      //   item,
      //   " prev ",
      //   prevItem,
      //   " should display ",
      //   shouldDisplay,
      //   " max ",
      //   max
      // );
      const displayValue =
        item < 1 || !inYears
          ? !inYears
            ? item
              ? item * 12 + "mo"
              : ""
            : item === arrNum[0] ||
              (shouldDisplay && (item / 0.25) % 1 === 0) ||
              (shouldDisplay && (item / 0.5) % 1 === 0) ||
              (shouldDisplay && (item / 0.75) % 1 === 0)
            ? item
              ? (item * 12) % 12 === 0
                ? item + "yr"
                : item * 12 + "mo"
              : ""
            : ""
          : shouldDisplay & (item % 1 === 0)
          ? item + "yr"
          : "";
      return {
        value: item,
        display: displayValue,
      };
    });
    const shouldRotateLabel = inYears && max >= 10;
    if (!arrNum.length) return null;
    return (
      <div className="slider-parent-container" ref={this.sliderContainerRef}>
        {!inYears && <div className="top-info-text">Past 1 Year</div>}
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
            value={+this.state.selectedDateRange}
            className="slider"
            onInput={this.handleDateRangeChange}
            onChange={this.handleDateRangeChange}
            noValidate
          />
          <div className="scale">
            {arrNum.map((item, index) => {
              const dataUnit = item < 1 ? "month" : "year";
              const displayValue = arrDisplayValues[index].display;
              const diff = dataUnit === "year" ? 0.1 : 0.001;
              const comparedVal = Math.abs(this.state.selectedDateRange - item);
              // console.log(
              //   "selected ",
              //   this.state.selectedDateRange,
              //   " item ",
              //   item,
              //   "compared va ",
              //   comparedVal,
              //   " diff ",
              //   diff,
              //   "active ? ",
              //   comparedVal <= diff
              // );
              return (
                <span
                  key={`scale_${index}`}
                  className={`label  ${inYears && max >= 10 ? "rotate" : ""} ${
                    comparedVal <= diff ? "active" : ""
                  }`}
                  ref={this.scaleLabelRefs[index]}
                  datavalue={item}
                  displayvalue={displayValue}
                  dataunit={dataUnit}
                >
                  {displayValue}
                </span>
              );
            })}
          </div>
        </div>
        <div
          className={`bottom-info-text exclude-from-copy ${
            shouldRotateLabel ? "gutter" : ""
          }`}
        >
          date range
        </div>
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
          top: 16,
          right: 8,
        }}
      >
        {this.renderCopyButton()}
      </div>
    );
  }

  getNotInGraphMessage() {
    if (!this.state.qids || !this.state.qids.length) return "";
    const noDataQids = this.state.qids
      .filter((item) => !this.isSurveyInDateRange(item))
      .map((item) => String(item).toUpperCase());
    if (!noDataQids.length) return "";
    const dateRange = this.getDisplayDateRange();
    const dateRangeText = dateRange ? `in the ${dateRange}` : "";
    return `No reportable data for ${noDataQids.join(
      ", "
    )} ${dateRangeText.toLowerCase()}`;
  }

  renderNotInGraphMessage() {
    return (
      <div
        className="text-warning"
        style={{
          margin: "8px",
          paddingLeft: "16px",
          paddingRight: "16px",
          minHeight: "20px",
        }}
      >
        {this.getNotInGraphMessage()}
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
      top: 20,
      right: 24,
      bottom: 68,
      left: 52,
    };
    // const parentWidth = 460;
    // const parentHeight = 508;
    const parentWidth = 480;
    const parentHeight = 420;
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
    additionalProps["dataPointsProps"] = {
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

    const renderLineMarkers = (props) => {
      const { data } = this.getDataForGraph(this.state.graphData);
      return getDataNest(data).map((o, index) => {
        return (
          <Markers
            key={`markers-${o.key}-${index}`}
            data={o.values}
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
      const containerStyle = {
        position: "absolute",
        width: "calc(100% - 32px)",
        height: "70%",
        background: "#f4f5f64d",
        left: "0",
        zIndex: 100,
        padding: "16px",
      };
      const textContainerStyle = {
        padding: "32px 0",
        margin: "auto",
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        lineHeight: 1.5,
      };
      return (
        <div className="flex flex-center text-warning" style={containerStyle}>
          <div style={textContainerStyle}>
            <FontAwesomeIcon icon="exclamation-circle" title="notice" />
            <div>{this.getNotInGraphMessage()}</div>
          </div>
        </div>
      );
    };
    const renderTitle = () => {
      const todayDateString = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
      return (
        <h3 className="panel-title">
          Longitudinal Scoring Overview{" "}
          <div className="date-string">(as of {todayDateString})</div>
        </h3>
      );
    };
    const renderGraph = () => {
      const svgProps = {
        className: "surveyChartSvg print-hidden",
        width: "100%",
        height: "100%",
        viewBox: `0 0 ${graphWidth} ${graphHeight}`,
        style: {
          fontFamily: "Open Sans, Arial, sans-serif",
          backgroundColor: "#FFF",
        },
      };
      if (noStateEntry) {
        // placeholder svg with grid lines if no state survey data
        return (
          <svg ref={this.graphRef} {...svgProps}>
            <g transform={`translate(${margins.left}, ${margins.top})`}>
              {/* y grid */}
              {renderYGrid()}
              {/* x grid */}
              {renderXGrid()}
            </g>
          </svg>
        );
      }
      return (
        <svg ref={this.graphRef} {...svgProps}>
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
            {renderLineMarkers()}
            {renderToolTips()}
          </g>
        </svg>
      );
    };

    if (noEntry)
      return (
        <React.Fragment>
          <div className="no-entries">No graph data to show.</div>
          {this.shouldShowAccessories() && this.renderLegend()}
        </React.Fragment>
      );

    return (
      <React.Fragment>
        <div className="survey-graph" ref={this.graphContainerRef}>
          {renderTitle()}
          <div className="flex">
            <div style={{ position: "relative", width: "100%", gap: "24px" }}>
              {noStateEntry && renderNoStateEntry()}
              <div
                className="survey-svg-container"
                style={{ position: "relative" }}
              >
                {renderGraph()}
              </div>
              {this.shouldShowSlider() && this.renderSlider()}
              {!this.shouldShowSlider() && <br />}
            </div>
            <div
              className="flex flex-gap-1"
              style={{ marginTop: (graphHeight / 2) * -1 + "px" }}
            >
              {this.renderUtilButtons()}
              {this.renderLegend()}
            </div>
          </div>
          {!noStateEntry && this.renderNotInGraphMessage()}
          {this.renderPrintOnlyImage()}
        </div>
      </React.Fragment>
    );
  }
}

SurveyGraph.propTypes = {
  data: PropTypes.array,
};
