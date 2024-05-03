import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import tocbot from "tocbot";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import executeElm from "../utils/executeELM";
import {
  getMMEErrors,
  getProcessedAlerts,
  getProcessedGraphData,
  getProcessedStatsData,
  getProcessedSummaryData,
} from "../helpers/landing.util";
import { datishFormat } from "../helpers/formatit";
import {
  getPatientNameFromSource,
  isInViewport,
  isNotProduction,
  isProduction,
  saveData,
  writeToLog,
} from "../helpers/utility";
import Timeout from "../helpers/timeout";
import summaryMap from "../config/summary_config.json";

import { getEnv, getEnvs, fetchEnvData } from "../utils/envConfig";
import SystemBanner from "./SystemBanner";
import Header from "./Header";
import Report from "./Report";
import Summary from "./Summary";
import Spinner from "../elements/Spinner";
//import CopyPaste from "./report/CopyPaste";

let processIntervalId = 0;
let scrollHeaderIntervalId = 0;

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
      mmeErrors: false,
      tocInitialized: false,
      errorCollection: []
    };
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
  getPatientName() {
    const summary = this.state.result ? this.state.result.Summary : null;
    const patientName = summary && summary.Patient ? summary.Patient.Name : "";
    return patientName;
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
      let itemURL = item?.url;
      try {
        itemURL = new URL(itemURL).pathname;
      } catch (e) {
        console.log("Unable to convert url to URL object ", item.url);
        itemURL = item?.url;
      }
      const sourceType = item?.type ?? itemURL;
      const sourceTypeText = sourceType ? `[${sourceType}]` : "";
      this.setError(`${sourceTypeText} ${item.error}`);
    });
  }
  //compile error(s) related to MME calculations
  processSummaryErrors(summary) {
    if (!summary) return false;
    let errors = getMMEErrors(summary, true, {
      tags: ["mme-calc"],
      patientName: this.getPatientName(),
    });
    if (!errors || !errors.length) return;
    errors.forEach((message) => {
      this.setError(message);
    });
    //set MME error flag
    if (errors.length)
      this.setState({
        mmeErrors: true,
      });
  }
  setError(message) {
    if (!message) return;
    this.setState({
      errorCollection: [...this.state.errorCollection, message]
    })
    writeToLog(message, "error", this.getPatientName());
  }

  //save MME calculations to file for debugging purpose, development environment ONLY
  saveSummaryData() {
    if (isProduction()) return;
    const summary = this.state.result ? this.state.result.Summary : null;
    if (!summary) return;
    const patientName = this.getPatientName();
    //pdmp data
    const pdmpData = summary["PDMPMedications"]
      ? summary["PDMPMedications"]["PDMPMedications"]
      : null;
    if (!pdmpData) return;
    const pdmpContext = "CQL PMP MME Result";
    const fileName = patientName.replace(/\s/g, "_") + "_MME_Result";
    saveData({
      context: pdmpContext,
      data: pdmpData,
      filename: fileName,
      timestamp: new Date(),
    });
    //can save other data if needed
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
        writeToLog(`Education material: ${e.target.title}`, "info", {
          tags: ["education"],
          patientName: this.getPatientName(),
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
        //set FHIR results
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
        writeToLog("application loaded", "info", {
          patientName: this.getPatientName(),
        });
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
            if (summaryMap[this.getOverviewSectionKey()]) {
              this.processAlerts(result["Summary"], sectionFlags);
            }
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
    const MIN_HEADER_HEIGHT = this.shouldShowTabs() ? 180 : 100;
    tocbot.init({
      tocSelector: ".active .summary__nav", // where to render the table of contents
      contentSelector: ".active .summary__display", // where to grab the headings to build the table of contents
      headingSelector: "h2, h3", // which headings to grab inside of the contentSelector element
      positionFixedSelector: ".active .summary__nav", // element to add the positionFixedClass to
      ignoreSelector: "h3.panel-title",
      collapseDepth: 0, // how many heading levels should not be collpased
      includeHtml: true, // include the HTML markup from the heading node, not just the text,
      // fixedSidebarOffset: this.shouldShowTabs() ? -1 * MIN_HEADER_HEIGHT : "auto",
      headingsOffset: 1 * MIN_HEADER_HEIGHT,
      scrollSmoothOffset: -1 * MIN_HEADER_HEIGHT,
    });
  }

  componentDidUpdate() {
    // if (this.state.activeTab === 10) {
    //   tocbot.destroy();
    //   this.tocInitialized = false;
    //   return;
    // }
    if (!this.state.tocInitialized && !this.state.loading && this.state.result) {
      this.initializeTocBot();
      this.setState({
        tocInitialized: true
      })
    } else {
      if (this.state.tocInitialized) {
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
    document.addEventListener("scroll", () => {
      clearTimeout(scrollHeaderIntervalId);
      scrollHeaderIntervalId = setTimeout(
        function () {
          if (!isInViewport(this.anchorTopRef.current)) {
            document.querySelector("body").classList.add("fixed");
            return;
          }
          document.querySelector("body").classList.remove("fixed");
        }.bind(this),
        150
      );
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

  processSummary(summary) {
    return getProcessedSummaryData(summary, summaryMap);
  }

  processAlerts(summary, sectionFlags) {
    summary[this.getOverviewSectionKey() + "_alerts"] = getProcessedAlerts(
      sectionFlags,
      {
        tags: ["alert"],
        patientName: this.getPatientName(),
      }
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
    summary[this.getOverviewSectionKey() + "_graph"] = getProcessedGraphData(
      graphConfig,
      graph_data
    );
  }

  processOverviewStatsData(summary) {
    const overviewSection = summaryMap[this.getOverviewSectionKey()];
    if (!overviewSection) {
      return false;
    }
    const config = overviewSection.statsConfig;
    if (!config || !config.data) {
      summary[this.getOverviewSectionKey() + "_stats"] = {};
      return;
    }
    const dataSource = summary[config.dataKeySource]
      ? summary[config.dataKeySource][config.dataKey]
      : [];
    const stats = getProcessedStatsData(config.data, dataSource);
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
    const meetsInclusionCriteria = summary.Patient
      ? summary.Patient.MeetsInclusionCriteria
      : false;
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

  handleSetActiveTab(index) {
    this.setState({
      activeTab: index,
    });
    window.scrollTo(0, 0);
  }

  renderHeader(summary, patientResource, PATIENT_SEARCH_URL) {
    const summaryPatient = summary.Patient ?? {};
    return (
      <Header
        patientName={getPatientNameFromSource(patientResource)}
        patientDOB={datishFormat(this.state.result, patientResource.birthDate)}
        patientGender={summaryPatient.Gender}
        meetsInclusionCriteria={summaryPatient.MeetsInclusionCriteria}
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
        errorCollection={this.state.errorCollection}
        mmeErrors={this.state.mmeErrors}
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
        {/* this just to test copy and paste */}
        {/* <div
          className={`tab ${this.state.activeTab === 10 ? "active" : ""}`}
          onClick={() => this.handleSetActiveTab(10)}
          role="presentation"
          key={`tab_10`}
        >
          COPY & PASTE
        </div> */}
      </div>
    );
  }

  renderTabPanels(summary, sectionFlags) {
    const tabs = this.getTabs();
    return (
      <div className="tab-panels">
        <React.Fragment>
          {tabs.map((item, index) => {
            return (
              <div
                className={`tab-panel ${
                  this.state.activeTab === index ? "active" : ""
                } ${tabs.length > 1 ? "multi-tabs" : ""}`}
                key={`tab-panel_${item}`}
              >
                {item === "overview" &&
                  this.renderSummary(summary, sectionFlags)}
                {item === "report" && (
                  <Report summaryData={summary.SurveySummary}></Report>
                )}
                {/* other tab panel as specified here */}
              </div>
            );
          })}
          {/* this is to test copy and paste */}
          {/* <div
            className={`tab-panel  multi-tabs ${
              this.state.activeTab === 10 ? "active" : ""
            }`}
          >
            <CopyPaste patientInfo={summary.Patient}></CopyPaste>
          </div> */}
        </React.Fragment>
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
        {isNotProduction() && (
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
