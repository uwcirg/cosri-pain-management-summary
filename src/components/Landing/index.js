import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import tocbot from "tocbot";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import executeElm from "../../utils/executeELM";
import * as landingUtils from "./utility";
import { datishFormat } from "../../helpers/formatit";
import {
  getPatientNameFromSource,
  isInViewport,
  isNotProduction,
  isProduction,
  saveData,
  writeToLog,
} from "../../helpers/utility";
import Timeout from "../../helpers/timeout";
import summaryMap from "../../config/summary_config.json";

import { getEnv, getEnvs, fetchEnvData } from "../../utils/envConfig";
import SystemBanner from "../SystemBanner";
import Header from "../Header";
import Report from "../Report";
import Summary from "../Summary";
import Spinner from "../../elements/Spinner";
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
      errorCollection: [],
      externalDataFetchErrors: {},
      summaryMap: summaryMap,
    };
    // This binding is necessary to make `this` work in the callback
    this.handleSetActiveTab = this.handleSetActiveTab.bind(this);
    this.handleHeaderPos = this.handleHeaderPos.bind(this);
    this.anchorTopRef = React.createRef();
  }

  componentDidMount() {
    // fetch env data where necessary, i.e. env.json, to ensure REACT env variables are available
    fetchEnvData();
    // write out environment variables:
    getEnvs();
    // start time out countdown on DOM mounted
    Timeout();
    this.getProcessProgressDisplay();
    // hide section(s) per config
    this.setSectionsVis();
    let result = {};
    Promise.all([executeElm(this.state.collector, this.state.resourceTypes)])
      .then((response) => {
        //set FHIR results
        let fhirData = response[0];
        result["Summary"] = fhirData ? { ...fhirData["Summary"] } : {};
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
        this.getExternalData()
          .then((externalDataSet) => {
            result["Summary"] = { ...result["Summary"], ...externalDataSet };
            const { sectionFlags, flaggedCount } = this.processSummary(
              result.Summary
            );
            this.savePDMPSummaryData();
            this.processSummaryErrors(result.Summary);
            this.processOverviewStatsData(result["Summary"]);
            if (summaryMap[this.getOverviewSectionKey()]) {
              this.processAlerts(result["Summary"], sectionFlags);
            }
            this.processGraphData(result["Summary"]);
            this.setState(
              {
                result,
                sectionFlags,
                flaggedCount,
                loading: false,
              },
              () => {
                this.initEvents();
                this.initializeTocBot();
              }
            );
            console.log("Query results ", result);
          })
          .catch((err) => {
            console.log(err);
            this.clearProcessInterval();
            this.setState({ loading: false });
            this.setError(err);
          });
      })
      .catch((err) => {
        console.error(err);
        this.clearProcessInterval();
        this.setState({ loading: false });
        this.setError(err);
      });
  }

  componentDidUpdate() {
    if (
      !this.state.tocInitialized &&
      !this.state.loading &&
      this.state.result
    ) {
      this.setState({
        tocInitialized: true,
      });
    } else {
      if (this.state.tocInitialized) {
        tocbot.refresh({ ...tocbot.options, hasInnerContainers: true });
      }
    }
    //page title
    document.title = "COSRI";
    if (this.shouldShowTabs()) {
      // for styling purpose
      document.querySelector("body").classList.add("has-tabs");
    }
  }

  initEvents() {
    // education material links
    document.querySelectorAll(".education").forEach((item) => {
      item.addEventListener("click", (e) => {
        writeToLog(`Education material: ${e.target.title}`, "info", {
          tags: ["education"],
          patientName: this.getPatientName(),
        });
      });
    });
    this.handleHeaderPos();
    // support other events if need to
  }

  // fixed header when scrolling in the event that it is not within viewport
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
        250
      );
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
      onClick: (e) => {
        e.preventDefault();
        const anchorElement = document.querySelector(`#${e.target.getAttribute("datasectionid")}__anchor`);
        if (anchorElement) {
          setTimeout(() => anchorElement.scrollIntoView(true), 50);
          return;
        }
        setTimeout(() => (e.target).scrollIntoView(true), 50);
      }
    });
  }

  setPatientId() {
    if (!this.state.collector) return;
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
  getProcessProgressDisplay() {
    processIntervalId = setInterval(() => {
      this.setState({
        loadingMessage: landingUtils.getProcessProgressDisplay(
          this.state.resourceTypes
        ),
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
      this.setError(`${sourceTypeText} ${item.error}`, true);
    });
  }

  processSummaryErrors(summary) {
    if (!summary) return false;
    //compile error(s) related to MME calculations
    let mmeErrors = landingUtils.getMMEErrors(summary, true, {
      tags: ["mme-calc"],
      patientName: this.getPatientName(),
    });
    if (mmeErrors && mmeErrors.length) {
      mmeErrors.forEach((error) => {
        this.setError(error, true);
      });
      this.setState({
        mmeErrors: true,
      });
    }
    // the rest of the errors
    let errors = [];
    for (let section in summary) {
      if (summary[section].error) {
        errors.push(summary[section].error);
      }
    }
    this.setState({
      errorCollection: [...this.state.errorCollection, ...errors],
    });
  }
  setError(message, shouldLog) {
    if (!message) return;
    this.setState({
      errorCollection: [...this.state.errorCollection, message],
    });
    if (shouldLog)
      writeToLog(message, "error", {
        patientName: this.getPatientName(),
      });
  }

  //save MME calculations to file for debugging purpose, development environment ONLY
  savePDMPSummaryData() {
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

  // hide and show section(s) depending on config
  setSectionsVis() {
    this.setState({
      summaryMap: {
        ...this.state.summaryMap,
        ...landingUtils.setSectionsVis(this.state.summaryMap),
      },
    });
  }

  async fetchExternalData(url, datasetKey, rootElement) {
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
        return Promise.reject(
          new Error(`There was error fetching data for ${datasetKey}: ${e}`)
        );
      }
    );

    let json = null;
    if (results) {
      try {
        //read response stream
        json = await results.json().catch((e) => {
          throw new Error(e);
        });
      } catch (e) {
        return Promise.reject(
          new Error(`There was error parsing data for ${datasetKey}: ${e}`)
        );
      }
    }

    if (!json) {
      let demoResult = await this.getDemoData(summaryMap[datasetKey]).catch(
        (e) => {
          return Promise.reject(
            new Error(`There was error fetching demo data: ${e}`)
          );
        }
      );
      //if unable to fetch data, set data to demo data if any
      json = await demoResult.json().catch((e) => {
        return Promise.reject(
          new Error(`There was error parsing demo data: ${e}`)
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
      return Promise.reject(
        `Data does not contained the required root element ${rootElement} for ${datasetKey}: ${e}`
      );
    }
    dataSet[datasetKey] = responseDataSet;
    return dataSet;
  }
  /*
   * function for retrieving data from other sources e.g. education materials
   */
  async getExternalData() {
    let dataSet = {};
    const promiseResultSet = landingUtils.getExternalDataSources(summaryMap);
    if (!promiseResultSet.length) {
      return dataSet;
    }
    let results = await Promise.allSettled(
      promiseResultSet.map((item) => {
        return this.fetchExternalData(
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
    let errors = {};
    promiseResultSet.forEach((item, index) => {
      let result = results[index];
      if (result.status === "rejected") {
        this.setError(
          `Error retrieving data for ${item.dataKey}: ${result.reason}`
        );
        errors[item.dataKey] = result.reason;
        this.setExternalDataFetchError(item.dataKey, result.reason);
      }
      //require additional processing of result data
      if (
        !errors[item.dataKey] &&
        item.processFunction &&
        this[item.processFunction]
      ) {
        try {
          result = this[item.processFunction](
            result.value ? result.value[item.dataKey] : null,
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
      if (errors[item.dataKey]) {
        dataSet[item.dataKeySource][item.dataKey] = {
          error: errors[item.dataKey],
        };
      }
      dataSet[item.dataKeySource][item.dataKey] = result.value
        ? result.value[item.dataKey]
        : result[item.dataKey]
        ? result[item.dataKey]
        : result;
    });
    return dataSet;
  }

  setExternalDataFetchError(sectionKey, error) {
    if (!sectionKey) return;
    this.setState({
      summaryMap: {
        ...summaryMap,
        [sectionKey]: {
          ...summaryMap[sectionKey],
          errorMessage: error,
        },
      },
    });
  }

  getOverviewSectionKey() {
    return "PatientRiskOverview";
  }

  processSummary(summary) {
    return landingUtils.getProcessedSummaryData(summary, summaryMap);
  }

  processAlerts(summary, sectionFlags) {
    summary[this.getOverviewSectionKey() + "_alerts"] =
      landingUtils.getProcessedAlerts(sectionFlags, {
        tags: ["alert"],
        patientName: this.getPatientName(),
      });
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
    summary[this.getOverviewSectionKey() + "_graph"] =
      landingUtils.getProcessedGraphData(graphConfig, graph_data);
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
    const stats = landingUtils.getProcessedStatsData(config.data, dataSource);
    summary[this.getOverviewSectionKey() + "_stats"] = stats;
  }

  processEndPoint(endpoint) {
    return landingUtils.processEndPoint(endpoint, {
      patientId: this.getPatientId(),
    });
  }

  async getDemoData(section) {
    return landingUtils.getDemoData(section, {
      patientId: this.getPatientId(),
    });
  }

  setDemoDataFlag(datasetKey) {
    if (summaryMap[datasetKey]) {
      this.setState({
        summaryMap: {
          ...summaryMap,
          [datasetKey]: {
            ...summaryMap[datasetKey],
            usedemoflag: true,
          },
        },
      });
    }
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
        summaryMap={this.state.summaryMap}
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
