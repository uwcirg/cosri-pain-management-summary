import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import tocbot from "tocbot";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import executeElm from "../utils/executeELM";
import flagit from "../helpers/flagit";
import {
  datishFormat,
  dateFormat,
  dateNumberFormat,
  extractDateFromGMTDateString,
} from "../helpers/formatit";
import { dateCompare } from "../helpers/sortit";
import { getDiffDays, isInViewport } from "../helpers/utility";
import Timeout from "../helpers/timeout";
import summaryMap from "../config/summary_config.json";

import { getEnv, getEnvs, fetchEnvData } from "../utils/envConfig";
import SystemBanner from "./SystemBanner";
import Header from "./Header";
import Report from "./Report";
import Summary from "./Summary";
import Spinner from "../elements/Spinner";

let uuid = 0;
let processIntervalId = 0;
let scrollHeaderIntervalId = 0;

function generateUuid() {
  return ++uuid; // eslint-disable-line no-plusplus
}

export default class Landing extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      result: null,
      loading: true,
      collector: [],
      resourceTypes: {},
      externals: {},
      patientId: "",
      activeTab: 0,
      loadingMessage: "Resources are being loaded...",
    };
    this.errorCollection = [];
    this.mmeErrors = false;
    this.tocInitialized = false;
    // This binding is necessary to make `this` work in the callback
    this.handleSetActiveTab = this.handleSetActiveTab.bind(this);
    this.handleHeaderPos = this.handleHeaderPos.bind(this);
    this.anchorTopRef = React.createRef();
  }

  setPatientId() {
    if (!this.state.collector) return;
    /*
     * passed down via fhir.js
     */
    let patientBundle = this.state.collector.filter(
      (item) =>
        item.data &&
        item.data.resourceType &&
        item.data.resourceType.toLowerCase() === "patient"
    );
    if (patientBundle.length) {
      this.setState({
        patientId: patientBundle[0].data.id,
      });
    }
  }
  getPatientId() {
    return this.state.patientId;
  }
  pingProcessProgress() {
    processIntervalId = setInterval(() => {
      let resourcesTypes = this.state.resourceTypes;
      let totalResources = 0;
      let numResourcesLoaded = 0;
      let loadedResources = "";
      const camel2title = (camelCase) =>
        camelCase
          .replace(/([A-Z])/g, (match) => ` ${match}`)
          .replace(/^./, (match) => match.toUpperCase())
          .trim();
      for (let key in resourcesTypes) {
        let title = camel2title(key);
        if (resourcesTypes[key]) {
          //data loaded text
          loadedResources += `<div class='text-success resource-item'>&#10003; ${title} data loaded</div>`;
          numResourcesLoaded = numResourcesLoaded + 1;
        } else {
          //data loading in progress
          loadedResources += `<div class='text-warning text-bold resource-item'>Loading ${title} data...</div>`;
        }
        totalResources = totalResources + 1;
      }
      let stillLoading = numResourcesLoaded < totalResources;
      let textClass = stillLoading ? "text-warning" : "text-success";
      this.setState({
        loadingMessage: `<div><div class='title-text'>${
          totalResources === 0
            ? "Gathering resources..."
            : totalResources + " resources are to be loaded."
        }</div><div class='${
          totalResources === 0 ? "hide" : "title-text"
        }'><span class='${textClass}'>${
          stillLoading ? numResourcesLoaded : totalResources
        } loaded ...</span></div><div class='resources-container'>${loadedResources}</div></div>`,
      });
    }, 30);
  }
  clearProcessInterval() {
    clearInterval(processIntervalId);
  }
  processCollectorErrors() {
    let collectorErrors = this.state.collector.filter((item) => {
      return item.error;
    });
    collectorErrors.forEach((item) => {
      this.setError(`[${item.type}] ${item.error}`);
    });
  }
  //compile error(s) related to MME calculations
  processSummaryErrors(summary) {
    if (!summary) return false;
    //PDMP medications
    let pdmpMeds = summary["PDMPMedications"];
    if (pdmpMeds && pdmpMeds["PDMPMedications"]) {
      let o = pdmpMeds["PDMPMedications"];
      let errors = [];
      let errorItems = [];
      o.forEach((item) => {
        //do not report medication that has been reported
        if (
          errorItems.filter((errorItem) => errorItem["name"] === item["name"])
            .length > 0
        )
          return true;
        let isOpioid =
          item["Class"] &&
          item["Class"].filter((medClass) => {
            return String(medClass).toLowerCase() === "opioid";
          }).length > 0;
        //IF not an opioid med don't raise error
        //look for medication that contains NDC code but not RxNorm Code, or contains all necessary information (NDC Code, RxNorm Code and Drug Class) but no MME
        if (
          isOpioid &&
          item["NDC_Code"] &&
          (!item["RXNorm_Code"] || !item["MME"])
        ) {
          errorItems.push(item);
          errors.push(
            `Medication, ${item["Name"]}, did not have an MME value returned, total MME and the MME overview graph are not reflective of total MME for this patient.`
          );
          //log failed MME calculation
          this.writeToLog(
            `MME calculation failure: Name: ${item.Name} NDC: ${item.NDC_Code} Quantity: ${item.Quantity} Duration: ${item.Duration} Factor: ${item.factor}`,
            "error",
            { tags: ["mme-calc"] }
          );
        }
        if (item.MME) {
          //log MME calculated if present
          this.writeToLog(
            `MME calculated: Name: ${item.Name} NDC: ${item.NDC_Code} RxNorm: ${item.RXNorm_Code} MME: ${item.MME}`,
            "info",
            { tags: ["mme-calc"] }
          );
        }
      });
      errors.forEach((message) => {
        this.setError(message);
      });
      //set MME error flag
      if (errors.length) this.mmeErrors = true;
    }
  }
  setError(message) {
    if (!message) return;
    this.errorCollection.push(message);
    this.writeToLog(message, "error");
  }
  //write to audit log
  writeToLog(message, level, params) {
    if (!getEnv("REACT_APP_CONF_API_URL")) return;
    if (!message) return;
    const logLevel = level ? level: "info";
    const logParams = params ? params : {};
    if (!logParams.tags) logParams.tags = [];
    logParams.tags.push("cosri-frontend");
    const auditURL = `${getEnv("REACT_APP_CONF_API_URL")}/auditlog`;
    const summary = this.state.result ? this.state.result.Summary : null;
    const patientName = summary && summary.Patient ? summary.Patient.Name : "";
    let messageString = "";
    if (typeof message === "object") {
      messageString = message.toString();
    } else messageString = message;
    fetch(auditURL, {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...{ patient: patientName, message: messageString, level: logLevel },
        ...logParams,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response.json();
      })
      .then(function (data) {
        console.log("audit request succeeded with response ", data);
      })
      .catch(function (error) {
        console.log("Request failed", error);
      });
  }
  //save MME calculations to file for debugging purpose, development environment ONLY
  saveSummaryData() {
    if (String(getEnv("REACT_APP_SYSTEM_TYPE")).toLowerCase() !== "development")
      return;
    const summary = this.state.result ? this.state.result.Summary : null;
    if (!summary) return;
    const patientName = summary && summary.Patient ? summary.Patient.Name : "";
    //pdmp data
    const pdmpData = summary["PDMPMedications"]
      ? summary["PDMPMedications"]["PDMPMedications"]
      : null;
    if (!pdmpData) return;
    const pdmpContext = "CQL PMP MME Result";
    const fileName = patientName.replace(/\s/g, "_") + "_MME_Result";
    this.saveData({
      context: pdmpContext,
      data: pdmpData,
      filename: fileName,
      timestamp: new Date(),
    });
    //can save other data if needed
  }
  saveData(queryParams) {
    if (!getEnv("REACT_APP_CONF_API_URL")) return;
    const saveDataURL = `${getEnv("REACT_APP_CONF_API_URL")}/save_data`;
    const params = queryParams || {};
    if (!params.data) return;
    fetch(saveDataURL, {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })
      .then((response) => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response.json();
      })
      .then(function (data) {
        console.log("save data request succeeded with response ", data);
      })
      .catch(function (error) {
        console.log("Request failed to save data: ", error);
      });
  }
  //hide and show sectioN(s) depending on config
  setSectionVis() {
    for (const key in summaryMap) {
      let sectionsToBeHidden = [];
      if (summaryMap[key]["sections"]) {
        //hide sub section if any
        summaryMap[key]["sections"].forEach((section) => {
          if (
            getEnv(`REACT_APP_SUBSECTION_${section.dataKey.toUpperCase()}`) ===
            "hidden"
          ) {
            section["hideSection"] = true;
            sectionsToBeHidden.push(section);
          }
        });
        if (
          sectionsToBeHidden.length !== summaryMap[key]["sections"].length &&
          sectionsToBeHidden.length > 0
        )
          continue;
      }
      //hide main section if any
      if (getEnv(`REACT_APP_SECTION_${key.toUpperCase()}`) === "hidden") {
        summaryMap[key]["hideSection"] = true;
      }
    }
  }
  initEvents() {
    //education material links
    document.querySelectorAll(".education").forEach((item) => {
      item.addEventListener("click", (e) => {
        this.writeToLog(`Education material: ${e.target.title}`, "info", {
          tags: ["education"],
        });
      });
    });
    //support other events if need to
  }

  componentDidMount() {
    /*
     * fetch env data where necessary, i.e. env.json, to ensure REACT env variables are available
     */
    fetchEnvData();

    // write out environment variables:
    getEnvs();
    //start time out countdown on DOM mounted
    Timeout();
    this.pingProcessProgress();
    let result = {};
    Promise.all([executeElm(this.state.collector, this.state.resourceTypes)])
      .then((response) => {
        //set result from data from EPIC
        let fhirData = response[0];
        result["Summary"] = fhirData ? { ...fhirData["Summary"] } : {};
        this.setSectionVis();
        const { sectionFlags, flaggedCount } = this.processSummary(
          result.Summary
        );
        this.setState({ result, sectionFlags, flaggedCount });
        this.setPatientId();
        setTimeout(
          function () {
            this.clearProcessInterval();
          }.bind(this),
          100
        );
        this.processCollectorErrors();
        this.writeToLog("application loaded", "info");
        //add data from other sources, e.g. PDMP
        Promise.all([this.getExternalData()])
          .then((externalData) => {
            result["Summary"] = { ...result["Summary"], ...externalData[0] };
            this.saveSummaryData();
            const { sectionFlags, flaggedCount } = this.processSummary(
              result.Summary
            );
            this.processSummaryErrors(result.Summary);
            this.processOverviewStatsData(result["Summary"]);
            this.processAlerts(result["Summary"], sectionFlags);
            this.processGraphData(result["Summary"]);
            this.setState({ result, sectionFlags, flaggedCount });
            this.setState({ loading: false });
            console.log("summary ", result);
            this.initEvents();
          })
          .catch((err) => {
            console.log(err);
            this.setState({ loading: false });
            this.clearProcessInterval();
            this.setError(err);
          });
      })
      .catch((err) => {
        console.error(err);
        this.setState({ loading: false });
        this.clearProcessInterval();
        this.setError(err);
      });
  }

  initializeTocBot() {
   // const MIN_HEADER_HEIGHT = this.shouldShowTabs() ? 156: 100;
   const MIN_HEADER_HEIGHT = this.shouldShowTabs() ? 156: 100;
    tocbot.init({
      tocSelector: ".active .summary__nav", // where to render the table of contents
      contentSelector: ".active .summary__display", // where to grab the headings to build the table of contents
      headingSelector: "h2, h3", // which headings to grab inside of the contentSelector element
      positionFixedSelector: ".active .summary__nav", // element to add the positionFixedClass to
      collapseDepth: 0, // how many heading levels should not be collpased
      includeHtml: true, // include the HTML markup from the heading node, not just the text,
     // fixedSidebarOffset: this.shouldShowTabs() ? -1 * MIN_HEADER_HEIGHT : "auto",
      headingsOffset: 1 * MIN_HEADER_HEIGHT,
      scrollSmoothOffset: -1 * (MIN_HEADER_HEIGHT),
    });
  }

  componentDidUpdate() {
    if (!this.tocInitialized && !this.state.loading && this.state.result) {
      this.initializeTocBot();
      this.tocInitialized = true;
    } else {
      if (this.tocInitialized) {
        tocbot.refresh({ ...tocbot.options, hasInnerContainers: true });
      }
    }
    //page title
    document.title = "COSRI";
    if (this.shouldShowTabs()) {
        document.querySelector("body").classList.add("has-tabs");
    }
    this.handleHeaderPos();
  }
  /*
   * fixed header when scrolling in the event that it is not within viewport
   */
  handleHeaderPos() {
    document.addEventListener("scroll",  () => {
      clearTimeout(scrollHeaderIntervalId);
      scrollHeaderIntervalId = setTimeout(function () {
        if (!isInViewport(this.anchorTopRef.current)) {
          document.querySelector("body").classList.add("fixed");
          return;
        }
        document.querySelector("body").classList.remove("fixed");
      }.bind(this), 150);
    });
  }
  /*
   * function for retrieving data from other sources e.g. PDMP
   */
  async getExternalData() {
    let dataSet = {};
    const promiseResultSet = [];
    const systemType = String(getEnv("REACT_APP_SYSTEM_TYPE")).toLowerCase();

    /*
     * retrieve entries from Summary map, i.e. summary.json that requires fetching data via external API
     */
    for (let key in summaryMap) {
      if (summaryMap[key].dataSource) {
        summaryMap[key].dataSource.forEach((item) => {
          if (item.endpoint && typeof item.endpoint === "object") {
            if (item.endpoint[systemType])
              item.endpoint = item.endpoint[systemType];
            else item.endpoint = item.endpoint["default"];
          }
          promiseResultSet.push(item);
        });
      }
    }

    if (!promiseResultSet.length) {
      return dataSet;
    }

    let results = await Promise.all(
      promiseResultSet.map((item) => {
        return this.fetchData(
          this.processEndPoint(item.endpoint),
          item.dataKey,
          item.dataKey
        );
      })
    ).catch((e) => {
      console.log(`Error parsing external data response json: ${e.message}`);
      promiseResultSet.forEach((item) => {
        dataSet[item.dataKeySource] = null;
      });
      return dataSet;
    });

    promiseResultSet.forEach((item, index) => {
      let result = results[index];
      //require additional processing of result data
      if (item.processFunction && this[item.processFunction]) {
        try {
          result = this[item.processFunction](
            results[index] ? results[index][item.dataKey] : null,
            item.dataKey
          );
        } catch (e) {
          console.log(
            `Error processing data result via processing function ${item.processFunction}: ${e}`
          );
        }
      }
      if (!dataSet[item.dataKeySource]) {
        dataSet[item.dataKeySource] = {};
      }
      dataSet[item.dataKeySource][item.dataKey] = result[item.dataKey]
        ? result[item.dataKey]
        : result;
    });
    return dataSet;
  }

  getOverviewSectionKey() {
    return "PatientRiskOverview";
  }

  processAlerts(summary, sectionFlags) {
    let overviewSection = summaryMap[this.getOverviewSectionKey()];
    if (!overviewSection) {
      return false;
    }
    let alerts = [];
    if (!sectionFlags) {
      return alerts;
    }
    //compile relevant alerts
    for (let section in sectionFlags) {
      for (let subsection of Object.entries(sectionFlags[section])) {
        if (subsection[1]) {
          if (typeof subsection[1] === "string") {
            alerts.push(subsection[1]);
          }
          if (typeof subsection[1] === "object") {
            if (Array.isArray(subsection[1])) {
              subsection[1].forEach((subitem) => {
                //this prevents addition of duplicate alert text
                let alertTextExist = alerts.filter(
                  (item) =>
                    String(item.flagText).toLowerCase() ===
                    String(subitem.flagText).toLowerCase()
                );
                if (!alertTextExist.length && subitem.flagText) {
                  let flagDateText = subitem.flagDateText
                    ? subitem.flagDateText
                    : "";
                  alerts.push({
                    id: subitem.subSection.dataKey,
                    name: subitem.subSection.name,
                    flagText: subitem.flagText,
                    className: subitem.flagClass,
                    text:
                      subitem.flagText.indexOf("[DATE]") >= 0
                        ? subitem.flagText.replace(
                            "[DATE]",
                            datishFormat("", flagDateText)
                          )
                        : subitem.flagText +
                          (subitem.flagDateText
                            ? ` (${datishFormat("", flagDateText)})`
                            : ""),
                    priority: subitem.priority || 100,
                  });
                  //log alert
                  this.writeToLog("alert flag: " + subitem.flagText, "warn", {
                    tags: ["alert"],
                  });
                }
              });
            } else if (subsection[1].flagText) {
              alerts.push({
                id: subsection[1].subSection.dataKey,
                name: subsection[1].subSection.name,
                text: subsection[1].flagText,
                className: subsection[1].flagClass,
                priority: subsection[1].priority || 100,
              });
            }
          }
        }
      }
    }
    alerts.sort(function (a, b) {
      return a.priority - b.priority;
    });
    summary[this.getOverviewSectionKey() + "_alerts"] = alerts.filter(
      (item, index, thisRef) =>
        thisRef.findIndex((t) => t.text === item.text) === index
    );
  }
  processGraphData(summary) {
    let overviewSection = summaryMap[this.getOverviewSectionKey()];
    if (!overviewSection) {
      return false;
    }
    //process graph data
    let graphConfig = overviewSection.graphConfig;
    if (!(graphConfig && graphConfig.summaryDataSource)) {
      return;
    }
    //get the data from summary data
    let sections = graphConfig.summaryDataSource;
    let graph_data = [];

    //demo config set to on, then draw just the demo graph data
    if (getEnv(graphConfig.demoConfigKey)) {
      graph_data = graphConfig.demoData;
      summary[this.getOverviewSectionKey() + "_graph"] = graph_data;
      return;
    }
    sections.forEach((item) => {
      if (
        summary[item.section_key] &&
        summary[item.section_key][item.subSection_key]
      ) {
        graph_data = [
          ...graph_data,
          ...summary[item.section_key][item.subSection_key],
        ];
      }
    });
    const [
      startDateFieldName,
      endDateFieldName,
      MMEValueFieldName,
      graphDateFieldName,
    ] = [
      graphConfig.startDateField,
      graphConfig.endDateField,
      graphConfig.mmeField,
      graphConfig.graphDateField,
    ];
    const START_DELIMITER_FIELD_NAME = "start_delimiter";
    const END_DELIMITER_FIELD_NAME = "end_delimiter";
    const PLACEHOLDER_FIELD_NAME = "placeholder";
    const FINAL_CALCULATED_FIELD_FLAG = "final";

    //sort data by start date
    graph_data = graph_data
      .filter(function (item) {
        return item[startDateFieldName] && item[endDateFieldName];
      })
      .sort(function (a, b) {
        return dateCompare(a[startDateFieldName], b[startDateFieldName]);
      });
    /*
     * 'NaN' is the value for null when coerced into number, need to make sure that is not included
     */
    const getRealNumber = (o) => (o && !isNaN(o) ? o : 0);
    let dataPoints = [];
    let prevObj = null,
      nextObj = null;
    graph_data.forEach(function (currentMedicationItem, index) {
      let dataPoint = {};
      let startDate = extractDateFromGMTDateString(
        currentMedicationItem[startDateFieldName]
      );
      let endDate = extractDateFromGMTDateString(
        currentMedicationItem[endDateFieldName]
      );
      let oStartDate = new Date(startDate);
      let diffDays = getDiffDays(startDate, endDate);
      nextObj =
        index + 1 <= graph_data.length - 1 ? graph_data[index + 1] : null;
      let currentMMEValue = getRealNumber(
        currentMedicationItem[MMEValueFieldName]
      );
      //add start date data point
      dataPoint = {};
      dataPoint[graphDateFieldName] = currentMedicationItem[startDateFieldName];
      dataPoint[MMEValueFieldName] = currentMMEValue;
      dataPoint[START_DELIMITER_FIELD_NAME] = true;
      dataPoint = { ...dataPoint, ...currentMedicationItem };
      dataPoints.push(dataPoint);

      //add intermediate data points between start and end dates
      if (diffDays >= 2) {
        for (let index = 2; index <= diffDays; index++) {
          let dataDate = new Date(oStartDate.valueOf());
          dataDate.setTime(dataDate.getTime() + index * 24 * 60 * 60 * 1000);
          dataDate = dateFormat("", dataDate, "YYYY-MM-DD");
          dataPoint = {};
          dataPoint[graphDateFieldName] = dataDate;
          dataPoint[MMEValueFieldName] = currentMMEValue;
          dataPoint[PLACEHOLDER_FIELD_NAME] = true;
          dataPoint[startDateFieldName] = dataDate;
          dataPoint = { ...dataPoint, ...currentMedicationItem };
          dataPoints.push(dataPoint);
        }
      }

      //add end Date data point
      dataPoint = {};
      dataPoint[graphDateFieldName] = currentMedicationItem[endDateFieldName];
      dataPoint[MMEValueFieldName] = currentMMEValue;
      dataPoint[END_DELIMITER_FIELD_NAME] = true;
      dataPoint[PLACEHOLDER_FIELD_NAME] = true;
      dataPoint = { ...dataPoint, ...currentMedicationItem };
      dataPoints.push(dataPoint);
      prevObj = currentMedicationItem;
    });

    //sort data by date
    dataPoints = dataPoints.sort(function (a, b) {
      return dateCompare(a[graphDateFieldName], b[graphDateFieldName]);
    });

    //get all available dates
    let arrDates = dataPoints.map((item) => item.date);
    arrDates = arrDates.filter((d, index) => {
      return arrDates.indexOf(d) === index;
    });

    //loop through graph data to ADD MME values for the ones occurring on the same date
    let cumMMEValue = 0;
    arrDates.forEach((pointDate) => {
      cumMMEValue = 0;
      let matchedItems = dataPoints.filter((d) => {
        return d.date === pointDate;
      });
      if (matchedItems.length <= 1) return true;
      matchedItems.forEach((o) => {
        cumMMEValue += getRealNumber(o[MMEValueFieldName]);
      });
      dataPoints.forEach((dataPoint) => {
        if (dataPoint.date === pointDate) {
          dataPoint[MMEValueFieldName] = cumMMEValue;
        }
      });
    });
    prevObj = null;
    let finalDataPoints = [];
    dataPoints.forEach(function (currentDataPoint, index) {
      let dataPoint = {};
      nextObj = dataPoints[index + 1] ? dataPoints[index + 1] : null;

      if (!prevObj) {
        //add starting graph point
        dataPoint = {};
        dataPoint[graphDateFieldName] = currentDataPoint[graphDateFieldName];
        dataPoint[MMEValueFieldName] = 0;
        dataPoint[START_DELIMITER_FIELD_NAME] = true;
        dataPoint[PLACEHOLDER_FIELD_NAME] = true;
        finalDataPoints.push(dataPoint);
      }
      //overlapping data points
      if (
        prevObj &&
        prevObj[MMEValueFieldName] !== currentDataPoint[MMEValueFieldName]
      ) {
        //add data point with MME value for the previous med as the connecting data point
        dataPoint = {};
        dataPoint[graphDateFieldName] = currentDataPoint[graphDateFieldName];
        dataPoint[MMEValueFieldName] = getRealNumber(
          prevObj[MMEValueFieldName]
        );
        dataPoint[PLACEHOLDER_FIELD_NAME] = true;
        finalDataPoints.push(dataPoint);
        finalDataPoints.push(currentDataPoint);
      } else if (
        prevObj &&
        currentDataPoint[START_DELIMITER_FIELD_NAME] &&
        dateNumberFormat(currentDataPoint[startDateFieldName]) >
          dateNumberFormat(prevObj[endDateFieldName])
      ) {
        //a new data point as med starts after the previous med ends
        if (
          getDiffDays(
            prevObj[endDateFieldName],
            currentDataPoint[startDateFieldName]
          ) > 1
        ) {
          dataPoint = {};
          dataPoint[graphDateFieldName] = currentDataPoint[graphDateFieldName];
          //add 0 value dummy data point to denote start of med where applicable
          dataPoint[MMEValueFieldName] = 0;
          //dataPoint[START_DELIMITER_FIELD_NAME] = true;
          dataPoint[PLACEHOLDER_FIELD_NAME] = true;
          finalDataPoints.push(dataPoint);
        }
        //add current data point
        finalDataPoints.push(currentDataPoint);
      } else if (
        nextObj &&
        currentDataPoint[END_DELIMITER_FIELD_NAME] &&
        dateNumberFormat(currentDataPoint[endDateFieldName]) <
          dateNumberFormat(nextObj[startDateFieldName])
      ) {
        //add current data point
        finalDataPoints.push(currentDataPoint);
        if (
          getDiffDays(
            currentDataPoint[endDateFieldName],
            nextObj[startDateFieldName]
          ) > 1
        ) {
          dataPoint = {};
          dataPoint[graphDateFieldName] = currentDataPoint[graphDateFieldName];
          //add 0 value dummy data point to denote end of med where applicable
          dataPoint[MMEValueFieldName] = 0;
          dataPoint[END_DELIMITER_FIELD_NAME] = true;
          dataPoint[PLACEHOLDER_FIELD_NAME] = true;
          finalDataPoints.push(dataPoint);
        }
      } else {
        if (!nextObj) currentDataPoint[FINAL_CALCULATED_FIELD_FLAG] = true;
        finalDataPoints.push(currentDataPoint);
      }

      if (!nextObj) {
        //add ending graph point
        dataPoint = {};
        dataPoint[graphDateFieldName] = currentDataPoint[graphDateFieldName];
        dataPoint[MMEValueFieldName] = 0;
        dataPoint[END_DELIMITER_FIELD_NAME] = true;
        dataPoint[PLACEHOLDER_FIELD_NAME] = true;
        finalDataPoints.push(dataPoint);
      }
      prevObj = finalDataPoints[finalDataPoints.length - 1];
    });
    console.log("graph data ", finalDataPoints);
    let formattedData = JSON.parse(JSON.stringify(finalDataPoints))
      .map((point) => {
        let o = {};
        o[graphDateFieldName] = point[graphDateFieldName];
        o[MMEValueFieldName] = Math.round(
          getRealNumber(point[MMEValueFieldName])
        );
        if (point[PLACEHOLDER_FIELD_NAME]) {
          o[PLACEHOLDER_FIELD_NAME] = point[PLACEHOLDER_FIELD_NAME];
        }
        if (point[FINAL_CALCULATED_FIELD_FLAG]) {
          o[FINAL_CALCULATED_FIELD_FLAG] = true;
        }
        return o;
      })
      .filter(
        (item, index, ref) =>
          ref.findIndex(
            (target) => JSON.stringify(target) === JSON.stringify(item)
          ) === index
      );

    summary[this.getOverviewSectionKey() + "_graph"] = formattedData;
  }

  processOverviewStatsData(summary) {
    let overviewSection = summaryMap[this.getOverviewSectionKey()];
    if (!overviewSection) {
      return false;
    }
    let stats = {};
    let config = overviewSection.statsConfig;
    if (!config || !config.data) {
      summary[this.getOverviewSectionKey() + "_stats"] = {};
      return;
    }
    let dataSource = summary[config.dataKeySource]
      ? summary[config.dataKeySource][config.dataKey]
      : [];

    //compile tally of source identified by a key
    config.data.forEach((item) => {
      let dataSet = [],
        statItem = {};
      let keyMatch = item.keyMatch,
        summaryFields = item.summaryFields,
        matchSet = item.matchSet;
      if (keyMatch && matchSet) {
        matchSet.forEach((subitem) => {
          let matchItem = {};
          matchItem[keyMatch] = subitem.display_name;
          matchItem.data = [];
          /* get matching data for each key */
          subitem.keys.forEach((key) => {
            let matchedData = dataSource.filter((d) => {
              if (Array.isArray(d[keyMatch])) {
                return d[keyMatch].indexOf(key) !== -1;
              }
              return d[keyMatch] === key;
            });
            matchItem.data = [...matchItem.data, ...matchedData];
          });
          summaryFields.forEach((summaryField) => {
            if (summaryField.key === "total") {
              matchItem[summaryField.key] = matchItem.data.length;
              return true;
            }
            if (summaryField.identifier) return true;
            let matchedDataByKey = matchItem.data.filter(
              (dItem) => dItem[summaryField.key]
            );
            //de-duplicate
            matchItem[summaryField.key] = Array.from(
              new Set(matchedDataByKey.map((dItem) => dItem[summaryField.key]))
            ).length;
          });
          dataSet.push(matchItem);
        });
        statItem = {
          fields: summaryFields,
          data: dataSet,
        };
        stats[item.title] = statItem;
      } //end if keyMatch & matchSet
      else if (keyMatch) {
        let filteredStatsSource = dataSource.filter(
          (element) => element[item.keyMatch]
        );
        filteredStatsSource = Array.from(
          new Set(filteredStatsSource.map((subitem) => subitem[item.keyMatch]))
        );
        statItem[item.title] = filteredStatsSource.length;
        stats.push(statItem);
      }
    });
    summary[this.getOverviewSectionKey() + "_stats"] = stats;
  }

  processEndPoint(endpoint) {
    if (!endpoint) return "";
    return endpoint
      .replace(
        "{process.env.REACT_APP_CONF_API_URL}",
        getEnv("REACT_APP_CONF_API_URL")
      )
      .replace("{process.env.PUBLIC_URL}", getEnv("PUBLIC_URL"))
      .replace("{patientId}", this.getPatientId());
  }

  async getDemoData(section) {
    if (!section || !section["demoData"]) return null;
    if (!section["demoData"]["endpoint"]) {
      return null;
    }
    return fetch(this.processEndPoint(section["demoData"]["endpoint"]));
  }

  setDemoDataFlag(datasetKey) {
    if (summaryMap[datasetKey]) {
      summaryMap[datasetKey].usedemoflag = true;
    }
  }

  setDataError(datasetKey, message) {
    if (!summaryMap[datasetKey] || !message) {
      return;
    }
    console.log(message); //display error in console
    summaryMap[datasetKey]["errorMessage"] = message;
  }

  async fetchData(url, datasetKey, rootElement) {
    let dataSet = {};
    dataSet[datasetKey] = {};
    const MAX_WAIT_TIME = 15000;
    // Create a promise that rejects in maximum wait time in milliseconds
    let timeoutPromise = new Promise((resolve, reject) => {
      let id = setTimeout(() => {
        clearTimeout(id);
        reject(`Timed out in ${MAX_WAIT_TIME} ms.`);
      }, MAX_WAIT_TIME);
    });

    /*
     * if for some reason fetching the request data doesn't resolve or reject withing the maximum waittime,
     * then the timeout promise will kick in
     */
    let results = await Promise.race([fetch(url), timeoutPromise]).catch(
      (e) => {
        this.setDataError(datasetKey, `There was error fetching data: ${e}`);
      }
    );

    let json = null;
    if (results) {
      try {
        //read response stream
        json = await results.json().catch((e) => {
          this.setDataError(
            datasetKey,
            `There was error parsing data: ${e.message}`
          );
        });
      } catch (e) {
        this.setDataError(datasetKey, `There was error parsing data: ${e}`);
        json = null;
      }
    }

    if (!json) {
      let demoResult = await this.getDemoData(summaryMap[datasetKey]).catch(
        (e) => {
          this.setDataError(
            datasetKey,
            `There was error fetching demo data: ${e}`
          );
        }
      );
      //if unable to fetch data, set data to demo data if any
      json = await demoResult.json().catch((e) => {
        this.setDataError(
          datasetKey,
          `There was error parsing demo data: ${e.message}`
        );
      });
      if (json && json[rootElement]) {
        this.setDemoDataFlag(datasetKey);
      }
    }
    let responseDataSet = null;
    try {
      responseDataSet = json[rootElement];
    } catch (e) {
      this.setDataError(
        datasetKey,
        `Data does not contained the required root element ${rootElement}: ${e}`
      );
      responseDataSet = null;
    }
    dataSet[datasetKey] = responseDataSet;
    return dataSet;
  }

  getAnalyticsData(endpoint, apikey, summary) {
    const meetsInclusionCriteria = summary.Patient.MeetsInclusionCriteria;
    const applicationAnalytics = {
      meetsInclusionCriteria,
    };

    if (meetsInclusionCriteria) {
      let totalCount = 0;
      applicationAnalytics.sections = [];

      const cloneSections = JSON.parse(JSON.stringify(summary));
      delete cloneSections.Patient;

      // Build total number of entries for each subsection of the summary.
      Object.keys(cloneSections).forEach((sectionKey, i) => {
        applicationAnalytics.sections.push({
          section: sectionKey,
          subSections: [],
        });
        Object.keys(cloneSections[sectionKey]).forEach((subSectionKey) => {
          let SectionElement = cloneSections[sectionKey];
          if (!SectionElement) return true;
          const subSection = SectionElement[subSectionKey];
          if (!subSectionKey) return true;
          let count;
          if (subSection instanceof Array) count = subSection.length;
          else if (subSection instanceof Object) count = 1;
          else count = 0;
          totalCount += count;
          applicationAnalytics.sections[i].subSections.push({
            subSection: subSectionKey,
            numEntries: count,
          });
        });
      });

      applicationAnalytics.totalNumEntries = totalCount;
    }

    let jsonBody = JSON.stringify(applicationAnalytics);

    const requestOptions = {
      body: jsonBody,
      headers: {
        "x-api-key": `${apikey}`,
        "Content-Type": "application/json",
        "Content-Length": jsonBody.length,
      },
      method: "POST",
    };

    fetch(`${endpoint}`, requestOptions).catch((err) => {
      console.log(err);
    });
  }

  isNonProduction() {
    let systemType = getEnv("REACT_APP_SYSTEM_TYPE");
    return systemType && String(systemType).toLowerCase() !== "production";
  }

  handleSetActiveTab(index) {
    this.setState({
      activeTab: index,
    });
    window.scrollTo(0, 0);
  }

  processSummary(summary) {
    const sectionFlags = {};
    const sectionKeys = Object.keys(summaryMap);
    let flaggedCount = 0;

    sectionKeys.forEach((sectionKey, i) => {
      // for each section
      sectionFlags[sectionKey] = {};
      //don't process flags for section that will be hidden
      if (summaryMap[sectionKey]["hideSection"]) {
        summary[sectionKey] = [];
        return true;
      }
      summaryMap[sectionKey]["sections"].forEach((subSection) => {
        // for each sub section
        if (!subSection) return true;
        //don't process flags for sub section that will be hidden
        if (subSection["hideSection"]) {
          summary[subSection.dataKeySource][subSection.dataKey] = [];
          return true;
        }
        const keySource = summary[subSection.dataKeySource];
        if (!keySource) {
          return true;
        }
        const data = keySource[subSection.dataKey];
        const entries = (Array.isArray(data) ? data : [data]).filter(
          (r) => r != null
        );
        const alertMapping = subSection.alertMapping || {};

        if (entries.length > 0) {
          sectionFlags[sectionKey][subSection.dataKey] = entries.reduce(
            (flaggedEntries, entry) => {
              if (entry._id == null) {
                entry._id = generateUuid();
              }
              const entryFlag = flagit(entry, subSection, summary);
              if (entryFlag) {
                flaggedCount += 1;
                let flagText =
                  typeof entryFlag === "object" ? entryFlag["text"] : entryFlag;
                let flagClass =
                  typeof entryFlag === "object" ? entryFlag["class"] : "";
                let flagDateField =
                  typeof entryFlag === "object"
                    ? entryFlag["date"]
                    : alertMapping.dateField
                    ? alertMapping.dateField
                    : null;

                flaggedEntries.push({
                  entryId: entry._id,
                  entry: entry,
                  subSection: subSection,
                  flagText: flagText,
                  flagClass: flagClass,
                  flagCount: flaggedCount,
                  flagDateText:
                    entry && entry[flagDateField]
                      ? extractDateFromGMTDateString(entry[flagDateField])
                      : "",
                  priority: alertMapping.priority ? alertMapping.priority : 0,
                });
              }

              return flaggedEntries;
            },
            []
          );
        } else {
          const sectionFlagged = flagit(null, subSection, summary);
          // console.log("subSection? ", subSection, " flagged? ", sectionFlagged)
          if (sectionFlagged) {
            flaggedCount += 1;
            sectionFlags[sectionKey][subSection.dataKey] = [
              {
                flagText:
                  typeof sectionFlagged === "object"
                    ? sectionFlagged["text"]
                    : sectionFlagged,
                flagCount: flaggedCount,
                subSection: subSection,
                priority: alertMapping.priority ? alertMapping.priority : 0,
              },
            ];
          }
        }
      });
    });

    //console.log("sectionFlags ", sectionFlags);
    // Get the configured endpoint to use for POST for app analytics
    fetch(`${getEnv("PUBLIC_URL")}/config.json`)
      .then((response) => response.json())
      .then((config) => {
        // Only provide analytics if the endpoint has been set
        if (config.analytics_endpoint) {
          this.getAnalyticsData(
            config.analytics_endpoint,
            config.x_api_key,
            summary
          );
        }
      })
      .catch((err) => {
        console.log(err);
      });

    return { sectionFlags, flaggedCount };
  }

  renderHeader(summary, patientResource, PATIENT_SEARCH_URL) {
    return (
      <Header
        patientName={summary.Patient.Name}
        patientDOB={datishFormat(this.state.result, patientResource.birthDate)}
        patientGender={summary.Patient.Gender}
        meetsInclusionCriteria={summary.Patient.MeetsInclusionCriteria}
        patientSearchURL={PATIENT_SEARCH_URL}
        siteID={getEnv("REACT_APP_SITE_ID")}
      />
    );
  }

  renderSummary(summary, sectionFlags) {
    return (
      <Summary
        summary={summary}
        patient={summary.Patient}
        sectionFlags={sectionFlags}
        collector={this.state.collector}
        errorCollection={this.errorCollection}
        mmeErrors={this.mmeErrors}
        result={this.state.result}
      />
    );
  }

  shouldShowTabs() {
    const tabs = this.getTabs();
    return tabs && tabs.length > 1;
  }

  getTabs() {
    let tabs = ["overview"];
    const config_tab = getEnv("REACT_APP_TABS");
    if (config_tab) tabs = config_tab.split(",");
    return tabs;
  }

  renderTabs() {
    const tabs = this.getTabs();
    return (
      <div className={"tabs " + (!this.shouldShowTabs() ? "hide" : "")}>
        {tabs.map((item, index) => {
          return (
            <div
              className={`tab ${
                this.state.activeTab === index ? "active" : ""
              }`}
              onClick={() => this.handleSetActiveTab(index)}
              role="presentation"
              key={`tab_${index}`}
            >
              {item.replace(/_/g, " ")}
            </div>
          );
        })}
      </div>
    );
  }

  renderTabPanels(summary, sectionFlags) {
    const tabs = this.getTabs();
    return (
      <div className="tab-panels">
        {tabs.map((item, index) => {
          return (
            <div
              className={`tab-panel ${
                this.state.activeTab === index ? "active" : ""
              } ${tabs.length > 1 ? "multi-tabs" : ""}`}
              key={`tab-panel_${item}`}
            >
              {item === "overview" && this.renderSummary(summary, sectionFlags)}
              {item === "report" && (
                <Report summaryData={summary.SurveySummary}></Report>
              )}
              {/* other tab panel as specified here */}
            </div>
          );
        })}
      </div>
    );
  }

  renderError(returnURL) {
    return (
      <div className="banner error root-error">
        <div>
          <FontAwesomeIcon icon="exclamation-circle" title="error" /> Error: See
          console for details.
        </div>
        <div className="banner__linkContainer">
          <a href={returnURL}>Back to Patient Search</a>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.loading) {
      return <Spinner loadingMessage={this.state.loadingMessage} />;
    }

    const PATIENT_SEARCH_ROOT_URL = getEnv("REACT_APP_DASHBOARD_URL");
    const PATIENT_SEARCH_URL = PATIENT_SEARCH_ROOT_URL + "/clear_session";

    if (this.state.result == null) {
      return this.renderError(PATIENT_SEARCH_ROOT_URL);
    }
    const patientResource = this.state.collector[0]["data"];
    const summary = this.state.result.Summary;
    const { sectionFlags } = this.state;

    return (
      <div className="landing">
        <div id="anchorTop" ref={this.anchorTopRef}></div>
        <div id="skiptocontent"></div>
        {this.isNonProduction() && (
          <SystemBanner type={getEnv("REACT_APP_SYSTEM_TYPE")}></SystemBanner>
        )}
        {this.renderHeader(summary, patientResource, PATIENT_SEARCH_URL)}
        <div className="warpper">
          {this.renderTabs()}
          {this.renderTabPanels(summary, sectionFlags)}
        </div>

        <ReactTooltip className="summary-tooltip" id="summaryTooltip" />
      </div>
    );
  }
}
