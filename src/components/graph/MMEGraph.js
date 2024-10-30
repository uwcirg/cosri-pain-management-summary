import React, { Component } from "react";
import PropTypes from "prop-types";
import { scaleLinear, scaleTime } from "d3-scale";
import { line } from "d3-shape";
import XYAxis from "./xy-axis";
import Area from "./area";
import Line from "./line";
import Markers from "./markers";
import Tooltip from "./tooltip";
import { dateFormat } from "../../helpers/formatit";
import { dateCompare } from "../../helpers/sortit";
import { sumArray, daysFromToday, isEmptyArray, renderImageFromSVG } from "../../helpers/utility";
import CopyButton from "../CopyButton";

const defaultFields = {
  x: "date",
  y: "MMEValue",
};
const xFieldName = defaultFields.x;
const yFieldName = defaultFields.y;
const DEFAULT_LINE_ID = "dataLine_default";
const BUP_LINE_ID = "dataLine_bup";
const WO_BUP_LINE_ID = "dataLine_no_bup";
const WITHOUT_BUP_KEY = "wo_buprenorphine";
const BUP_ONLY_KEY = "buprenorphine";
const DEFAULT_LINE_KEY = "default";
const DEFAULT_STROKE_COLOR = "#168698";
//const INFO_COLOR = "#056dc5";
//const INFO_COLOR = "#7d2184";
const NO_BUP_LINE_COLOR = "#a5a8a8";
const BUP_LINE_COLOR = "#014652";
const arrLineObj = [
  {
    id: BUP_LINE_ID,
    label: "Total MME with Bupe",
    style: {
      borderBottomColor: BUP_LINE_COLOR,
      borderBottomWidth: "4px",
      borderBottomStyle: "dotted",
    },
  },
  {
    id: WO_BUP_LINE_ID,
    label: "Total MME without Bupe",
    style: {
      borderBottomColor: NO_BUP_LINE_COLOR,
      borderBottomWidth: "4px",
      borderBottomStyle: "dotted",
    },
  },
];
export default class MMEGraph extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      lineIds: arrLineObj.map((o) => o.id),
    };
    //refs
    this.containerRef = React.createRef();
    this.switchCheckboxRefs = [];
    this.graphRef = React.createRef();
    this.printImageRef = React.createRef();

    // This binding is necessary to make `this` work in the callback
    this.addDataLineToGraph = this.addDataLineToGraph.bind(this);
    this.removeDataLineFromGraph = this.removeDataLineFromGraph.bind(this);
    this.handleSwitchChange = this.handleSwitchChange.bind(this);
  }
  componentDidMount() {
    this.initSwitchCheckboxRefs();
    setTimeout(() => {
      // rendering image for printing
      renderImageFromSVG(this.printImageRef.current, this.graphRef.current);
    }, 1500);
  }
  getDefaultDataValueSet(
    paramValue,
    paramMinDate,
    paramMaxDate,
    paramTotal,
    paramXFieldName,
    paramYFieldName
  ) {
    let data = [];
    const value = paramValue || 0;
    const total = paramTotal || 8;
    const xFieldName = paramXFieldName || defaultFields.x;
    const yFieldName = paramYFieldName || defaultFields.y;

    let maxDate = paramMaxDate,
      minDate = paramMinDate;

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
      index = index + 1;
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

  initSwitchCheckboxRefs() {
    // Initialize the array with React.createRef() objects
    for (let i = 0; i < this.state.lineIds.length; i++) {
      this.switchCheckboxRefs.push(React.createRef());
    }
  }

  renderCopyButton() {
    return (
      <CopyButton
        buttonTitle="Click to copy the graph"
        elementToCopy={this.containerRef.current}
      ></CopyButton>
    );
  }

  renderShadeArea(data, props) {
    if (isEmptyArray(data)) return null;
    const defaultData = data.filter((o) => o.type === DEFAULT_LINE_KEY);
    const noBupData = data.filter((o) => o.type === WITHOUT_BUP_KEY);
    return (
      <Area
        {...{
          ...(props ?? {}),
          data: [
            {
              x: defaultData.map((o) => o[xFieldName]),
              y: defaultData.map((o) => {
                return o[yFieldName];
              }),
            },
            {
              x: noBupData.map((o) => o[xFieldName]),
              y: noBupData.map((o) => {
                return o[yFieldName];
              }),
            },
          ],
        }}
      ></Area>
    );
  }

  renderDefaultTotalMMELine(data, lineProps, markerProps) {
    if (isEmptyArray(data)) return null;
    const lineId = DEFAULT_LINE_ID;
    return <Line lineID={lineId} key={lineId} data={data} {...lineProps} />;
  }

  renderTotalMMEMarkers(data, lineProps, markerProps) {
    if (isEmptyArray(data)) return null;
    const dataPointsProps = { ...markerProps, id: "default_markers" };
    return (
      <React.Fragment>
        <Markers data={data} {...lineProps} dataPointsProps={dataPointsProps} />
        <Tooltip
          data={data}
          {...lineProps}
          dataPointsProps={dataPointsProps}
        ></Tooltip>
      </React.Fragment>
    );
  }

  renderTotalMMEBupOnlyLine(data, lineProps) {
    if (isEmptyArray(data)) return null;
    const lineId = BUP_LINE_ID;
    const lineColor = BUP_LINE_COLOR;
    return (
      <Line
        lineID={lineId}
        key={lineId}
        data={data}
        {...{
          ...lineProps,
          strokeWidth: 5,
          strokeColor: lineColor,
          strokeFill: lineColor,
          // dotted: true,
          // dotSpacing: "4, 1",
        }}
      />
    );
  }

  renderTotalMMEWithoutBupLine(data, lineProps) {
    if (isEmptyArray(data)) return null;
    const lineId = WO_BUP_LINE_ID;
    const lineColor = NO_BUP_LINE_COLOR;

    return (
      <Line
        lineID={lineId}
        key={lineId}
        data={data}
        {...{
          ...lineProps,
          strokeWidth: 2,
          strokeColor: lineColor,
          strokeFill: lineColor,
          dotted: true,
          dotSpacing: "4, 2",
        }}
      />
    );
  }

  renderLineLegend(noBupData, bupOnlyLineData) {
    if (isEmptyArray(noBupData) && isEmptyArray(bupOnlyLineData)) return null;
    return (
      <div
        style={{
          width: "324px",
          marginLeft: "24px",
          marginRight: "24px",
          display: "flex",
          flexDirection: "column",
          rowGap: "8px",
          fontSize: "0.9em",
        }}
      >
        {!isEmptyArray(bupOnlyLineData) && (
          <div className="flex flex-start-1">
            <div
              style={{
                width: "60px",
                height: "2px",
                borderBottomColor: BUP_LINE_COLOR,
                borderBottomWidth: "4px",
                borderBottomStyle: "dotted",
              }}
            ></div>
            <div>MED totals including Buprenorphine</div>
          </div>
        )}
        {!isEmptyArray(noBupData) && (
          <div className="flex flex-start-1">
            <div
              style={{
                width: "60px",
                height: "2px",
                borderBottomColor: NO_BUP_LINE_COLOR,
                borderBottomWidth: "2px",
                borderBottomStyle: "dotted",
              }}
            ></div>
            <div>MED totals excluding Buprenorphine</div>
          </div>
        )}
      </div>
    );
  }

  renderSwitches() {
    const oLines = arrLineObj;
    return (
      <div className="legend-container print-hidden exclude-from-copy">
        <div
          className="legend"
          style={{
            margin: "10px 20px 20px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {oLines.map((item, index) => {
            return (
              <div
                className="legend__item flex"
                key={`line_legend_${item.id}_${index}`}
                style={{ fontSize: "0.7rem" }}
              >
                <div className="legend__item--key" style={item.style}>
                  <span className="text">{item.label.toUpperCase()}</span>
                </div>

                <div className="select-icons-container print-hidden">
                  <label
                    className={`exclude-from-copy switch`}
                    title={
                      this.isInGraph(item.id)
                        ? `Remove ${item.label} from graph`
                        : `Add ${item.label} to graph`
                    }
                  >
                    <input
                      type="checkbox"
                      value={item.id}
                      dataindex={index}
                      onChange={this.handleSwitchChange}
                      // disabled={
                      //   this.isInGraph(item.id) && this.hasOnlyOneGraphLine()
                      // }
                      checked={!!this.isInSelectedLineIds(item.id)}
                      ref={this.switchCheckboxRefs[index]}
                    />
                    <span className="switch-slider round"></span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  isInSelectedLineIds(id) {
    return this.state.lineIds.find((item) => item === id);
  }

  isInGraph(id) {
    if (isEmptyArray(this.state.lineIds)) return false;
    return this.state.lineIds.find((item) => item === id);
  }

  addDataLineToGraph(id, callback) {
    if (!id) {
      return;
    }
    this.setState(
      {
        lineIds: [...new Set([...this.state.lineIds, id])],
      },
      callback
    );
  }
  removeDataLineFromGraph(id, callback) {
    this.setState(
      {
        lineIds: this.state.lineIds.filter((item) => item !== id),
      },
      callback
    );
  }

  hasOnlyOneGraphLine() {
    return this.state.lineIds.length === 1;
  }

  handleSwitchChange(e) {
    const itemValue = e.target.value;
    const dataIndex = parseInt(e.target.getAttribute("dataindex"));
    let targetElement = this.switchCheckboxRefs[dataIndex]?.current;
    if (targetElement) targetElement.setAttribute("checked", e.target.checked);
    console.log("item value ", itemValue, " state ", this.state.lineIds);
    //if (!this.isInGraph(itemValue)) {
    if (e.target.checked) {
      this.addDataLineToGraph(itemValue);
    } else {
      this.removeDataLineFromGraph(itemValue);
    }
  }

  renderPrintOnlyImage() {
    return (
      <div className="print-only" style={{position: "absolute", top: 0, bottom: 0, right: 0, left: 0}}>
        <img
          ref={this.printImageRef}
          alt="for print"
          className="mme-graph print-image"
          style={{ zIndex: -1, position: "relative", width: "100%", height: "80%", objectFit: "contain" }}
        ></img>
      </div>
    );
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
    //const CDC_MAX_VALUE = 90;
    const xIntervals = 12;
    let lineParamsSet = [xIntervals, xFieldName, yFieldName];
    const hasError = this.props.showError;
    const propData = this.props.data;
    let compiledData = [];
    for (let key in propData) {
      const processedData = !isEmptyArray(propData[key])
        ? propData[key].map((o) => {
            o.type = key;
            return o;
          })
        : [];
      compiledData = [...compiledData, ...processedData];
    }
    //make a copy of the data so as not to accidentally mutate it
    //need to make sure the dates are sorted for line to draw correctly
    let computedData = !isEmptyArray(compiledData)
      ? compiledData.map((item) => {
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
    let graphStats = this.getStats(compiledData);
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
    maxDate = calcMaxDate.setDate(calcMaxDate.getDate() + 65);
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
    //let CDCData = this.getDefaultDataValueSet(CDC_MAX_VALUE, baseLineDate, maxDate, ...lineParamsSet);
    const noBupLineData = data.filter((o) => o.type === WITHOUT_BUP_KEY);
    const bupOnlyLineData = data.filter((o) => o.type === BUP_ONLY_KEY);
    const shouldShowSwitches =
      !isEmptyArray(noBupLineData) || !isEmptyArray(bupOnlyLineData);
    const shouldShowBupLine =
      !isEmptyArray(noBupLineData) && this.isInGraph(BUP_LINE_ID);
    const shouldShowNoBupLine =
      !isEmptyArray(noBupLineData) && this.isInGraph(WO_BUP_LINE_ID);
    // const shouldShowShade =
    //   this.isInGraph(BUP_LINE_ID) && this.isInGraph(WO_BUP_LINE_ID);
    const shouldShowMarkers =
      this.isInGraph(BUP_LINE_ID) || this.isInGraph(DEFAULT_LINE_ID);
    const margins = {
      top: 24,
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
    const DATA_STROKE_COLOR = shouldShowBupLine
      ? BUP_LINE_COLOR
      : DEFAULT_STROKE_COLOR;
    const additionalProps = {
      strokeColor: DATA_STROKE_COLOR,
      strokeFill: DATA_STROKE_COLOR,
      //   strokeWidth: 2.5,
      strokeWidth: 2.8,
      markerSize: 4,
    };
    additionalProps["dataPointsProps"] = {
      ...additionalProps,
      ...{
        strokeWidth: 2.5,
        strokeFill: DATA_STROKE_COLOR,
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
    const markerDataProps = additionalProps["dataPointsProps"];
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
      <div
        ref={this.containerRef}
        style={{ paddingBottom: "24px", backgroundColor: "#FFF" }}
      >
        <div
          className={`MMEgraph ${shouldShowSwitches ? "contain-switches" : ""}`}
        >
          <div className="flex">
            <div className="title">Morphine Equivalent Dose (MED)</div>
            <div>{this.renderCopyButton()}</div>
          </div>
          <div className="flex">
            <div className="MME-svg-container">
              <svg
                className="MMEChartSvg print-hidden"
                width="100%"
                height="100%"
                viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                ref={this.graphRef}
              >
                <g transform={`translate(${margins.left}, ${margins.top})`}>
                  <XYAxis {...{ xSettings, ySettings }} />
                  {/* {shouldShowShade && this.renderShadeArea(data, defaultProps)} */}
                  {shouldShowBupLine &&
                    this.renderTotalMMEBupOnlyLine(
                      bupOnlyLineData,
                      dataLineProps
                    )}
                  {shouldShowNoBupLine &&
                    this.renderTotalMMEWithoutBupLine(
                      noBupLineData,
                      dataLineProps
                    )}
                  {!shouldShowSwitches &&
                    this.isInGraph(DEFAULT_LINE_ID) &&
                    this.renderDefaultTotalMMELine(
                      data.filter((o) => o.type === DEFAULT_LINE_KEY),
                      dataLineProps,
                      markerDataProps
                    )}
                  {/* <Line lineID="dataLine" data={data} {...dataLineProps} /> */}
                  <Line
                    lineID="WALine"
                    strokeColor={WA_COLOR}
                    dotted="true"
                    dotSpacing="2, 1"
                    data={WAData}
                    className="wa-line"
                    style={{opacity: 0.4}}
                    {...defaultProps}
                  />
                  <Line
                    lineID="CDCSecondaryLine"
                    strokeColor={CDC_COLOR}
                    dotted="true"
                    dotSpacing="2, 1"
                    data={CDCSecondaryData}
                    className="cdc-line"
                    style={{opacity: 0.4}}
                    {...defaultProps}
                  />
                  {/* <Line lineID="CDCLine" strokeColor={CDC_COLOR} dotted="true" dotSpacing="3, 3" data={CDCData} {...defaultProps} /> */}
                  {/* <Tooltip data={data} {...dataLineProps}></Tooltip> */}
                  <text {...WALegendSettings}>
                    WA State: Consultation threshold
                  </text>
                  <text {...CDCLegendSettings} y={yScale(50 + textMargin)}>
                    CDC: Consider offering naloxone
                  </text>
                  {shouldShowMarkers &&
                    this.renderTotalMMEMarkers(
                      data.filter((o) =>
                        o.type === shouldShowBupLine
                          ? BUP_LINE_ID
                          : DEFAULT_LINE_KEY
                      ),
                      dataLineProps,
                      markerDataProps
                    )}
                  {/* <text {...CDCLegendSettings} y={yScale(90 + textMargin)}>
                  CDC avoid/justify threshold
                </text> */}
                </g>
              </svg>
              {this.renderPrintOnlyImage()}
            </div>
            {shouldShowSwitches && this.renderSwitches()}
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
        {/* {this.renderLineLegend(noBupLineData, bupOnlyLineData)} */}
      </div>
    );
  }
}

MMEGraph.propTypes = {
  data: PropTypes.object,
  showError: PropTypes.bool,
};
