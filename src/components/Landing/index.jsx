import React, { Component } from "react";
// import ReactTooltip from "react-tooltip";
import tocbot from "tocbot";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import executeElm from "../../utils/executeELM";
import * as landingUtils from "./utility";
import { datishFormat } from "../../helpers/formatit";
import {
  addMatomoTracking,
  getEnvSystemType,
  getEPICPatientIdFromSource,
  getPatientNameFromSource,
  getPatientSearchURL,
  getSiteId,
  isEmptyArray,
  isInViewport,
  isNotProduction,
  isProduction,
  isReportEnabled,
  writeToLog,
} from "../../helpers/utility";
import Timeout from "../../helpers/timeout";
import { getTokenInfoFromStorage } from "../../helpers/timeout";
import summaryMap from "../../config/summary_config.json";

import { getEnvs, fetchEnvData } from "../../utils/envConfig";
import SystemBanner from "../SystemBanner";
import Header from "../Header";
import Report from "../Report";
import Summary from "../Summary";
import Spinner from "../../elements/Spinner";
//import CopyPaste from "./report/CopyPaste";

let processIntervalId = 0;
let scrollHeaderIntervalId = 0;
let tocbotTntervalId = 0;

export default class Landing extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      result: null,
      loading: true,
      collector: [],
      resourceTypes: {},
      patientId: "",
      activeTab: 0,
      loadingMessage: "Resources are being loaded...",
      hasMmeErrors: false,
      mmeErrors: [],
      errorCollection: [],
      tocInitialized: false,
      summaryMap: summaryMap,
    };

    // This binding is necessary to make `this` work in the callback
    this.handleSetActiveTab = this.handleSetActiveTab.bind(this);
    this.handleHeaderPos = this.handleHeaderPos.bind(this);
    this.anchorTopRef = React.createRef();
  }

  componentDidMount() {
    if (
      !this.state ||
      !this.state.loading ||
      this.state.result ||
      !isEmptyArray(this.state.errorCollection)
    )
      return;

    // start time out countdown on DOM mounted
    Timeout();
    // fetch env data where necessary, i.e. env.json, to ensure REACT env variables are available
    fetchEnvData();
    // write out environment variables:
    getEnvs();
    // display resources loading statuses
    this.initProcessProgressDisplay();

    Promise.allSettled([
      executeElm(this.state.collector, this.state.resourceTypes),
      landingUtils.getExternalData(summaryMap),
    ])
      .then((responses) => {
        if (!getTokenInfoFromStorage()) {
          console.log("No access token found");
          this.handleNoAccessToken();
          return;
        }
        if (responses[0].status === "rejected" || !this.getPatientId()) {
          this.clearProcessInterval();
          const rejectReason = responses[0].reason ? responses[0].reason : "";
          console.log(rejectReason);
          this.logError(rejectReason);
          this.setState({
            loading: false,
            errorCollection: [rejectReason],
          });
          return;
        }
        // add PIWIK tracking
        addMatomoTracking();
        writeToLog("application loaded", "info", this.getPatientLogParams());
        //set FHIR results
        let result = {};
        let fhirData = responses[0].value;
        let externalDataSet = responses[1].value;
        // hide and show section(s) depending on config
        const currentSummaryMap = {
          ...this.state.summaryMap,
          ...landingUtils.getSummaryMapWithUpdatedSectionsVis(
            this.state.summaryMap
          ),
        };
        result["Summary"] = fhirData ? { ...fhirData["Summary"] } : {};
        result["Summary"] = {
          ...result["Summary"],
          ...(externalDataSet ? externalDataSet["data"] : {}),
        };
        const { sectionFlags, flaggedCount } =
          landingUtils.getProcessedSummaryData(
            result.Summary,
            currentSummaryMap
          );
        this.setSummaryOverviewStatsData(result["Summary"]);
        this.setSummaryAlerts(result["Summary"], sectionFlags);
        this.setSummaryGraphData(result["Summary"]);
        const collectorErrors = landingUtils.getCollectorErrors(
          this.state.collector
        );
        const { errors, hasMmeErrors, mmeErrors } =
          landingUtils.getSummaryErrors(result.Summary);
        landingUtils.logMMEEntries(result.Summary, {
          tags: ["mme-calc"],
          ...this.getPatientLogParams(),
        });
        // console.log(
        //   "errors ",
        //   errors,
        //   " hasMmeError ",
        //   hasMmeErrors,
        //   " mmeErrors ",
        //   mmeErrors
        // );
        const hasExternalDataError =
          externalDataSet && externalDataSet["errors"];
        const externalDataErrors = hasExternalDataError
          ? Object.values(externalDataSet["errors"])
          : [];
        // log errors
        [...collectorErrors, externalDataErrors].forEach((e) =>
          this.logError(e)
        );
        this.setState(
          {
            result,
            sectionFlags,
            flaggedCount,
            activeTab: 0,
            patientId: this.getPatientId(),
            hasMmeErrors: hasMmeErrors,
            mmeErrors: mmeErrors,
            errorCollection: [
              ...this.state.errorCollection,
              ...collectorErrors,
              ...externalDataErrors,
              ...landingUtils.getResponseErrors(responses),
              ...errors,
            ],
            summaryMap: landingUtils.getUpdatedSummaryMapWithErrors(
              currentSummaryMap,
              hasExternalDataError ? externalDataSet["error"] : null
            ),
            loading: false,
          },
          () => {
            this.initEvents();
            this.clearProcessInterval();
            this.savePDMPSummaryData();
            this.handleSetActiveTab(0);
          }
        );
        console.log("Query results ", result);
      })
      .catch((err) => {
        console.error(err);
        this.clearProcessInterval();
        this.setState({ loading: false });
        this.setError(err);
      });
  }

  componentDidUpdate() {
    if (!this.state.tocInitialized) this.initTocBot();
    //page title
    document.title = "COSRI";
    if (this.shouldShowTabs()) {
      // for styling purpose
      document.querySelector("body").classList.add("has-tabs");
    }
  }

  handleNoAccessToken() {
    const returnURL = getPatientSearchURL(true);
    if (returnURL && returnURL !== "/") {
      window.location = returnURL;
      return;
    }
    this.setState({
      loading: false,
      errorCollection: ["No access token information found."],
    });
  }

  initEvents() {
    const logParams = this.getPatientLogParams();
    // education material links
    document.querySelectorAll(".education").forEach((item) => {
      item.addEventListener("click", (e) => {
        writeToLog(`Education material: ${e.target.title}`, "info", {
          tags: ["education"],
          ...logParams,
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

  getTocBotOptions() {
    const MIN_HEADER_HEIGHT = this.shouldShowTabs() ? 180 : 100;
    const selectorClass = this.shouldShowTabs() ? ".active" : "";
    return {
      //tocSelector: ".active .summary__nav", // where to render the table of contents
      tocSelector: `${selectorClass} .summary__nav`.trim(), // where to render the table of contents
      contentSelector: `${selectorClass} .summary__display`.trim(), // where to grab the headings to build the table of contents
      headingSelector: "h2, h3", // which headings to grab inside of the contentSelector element
      positionFixedSelector: `${selectorClass} .summary__nav`.trim(), // element to add the positionFixedClass to
      ignoreSelector: "h3.panel-title",
      collapseDepth: 0, // how many heading levels should not be collpased
      includeHtml: true, // include the HTML markup from the heading node, not just the text,
      // fixedSidebarOffset: this.shouldShowTabs() ? -1 * MIN_HEADER_HEIGHT : "auto",
      headingsOffset: 1 * MIN_HEADER_HEIGHT,
      scrollSmoothOffset: -1 * MIN_HEADER_HEIGHT,
      hasInnerContainers: true,
      onClick: (e) => {
        e.preventDefault();
        const sectionIdAttr = "datasectionid";
        const containgElement = e.target.closest(`[${sectionIdAttr}]`);
        const sectionId = containgElement
          ? containgElement.getAttribute(sectionIdAttr)
          : e.target.getAttribute(sectionIdAttr);
        //e.stopPropagation();
        const anchorElement = document.querySelector(`#${sectionId}__anchor`);
        const listItems = document.querySelectorAll(".toc-list-item");
        const activeListItem = e.target.closest(".toc-list-item");
        const tocLinks = document.querySelectorAll(".toc-link");
        const activeLink = e.target.closest(".toc-link");
        if (anchorElement) {
          anchorElement.scrollIntoView(true);
        } else {
          e.target.scrollIntoView(true);
        }
        clearTimeout(tocbotTntervalId);
        tocbotTntervalId = setTimeout(() => {
          tocLinks.forEach((el) => {
            if (el.isEqualNode(activeLink)) {
              el.classList.add("is-active-link");
              return true;
            }
            el.classList.remove("is-active-link");
          });
          listItems.forEach((el) => {
            if (el.isEqualNode(activeListItem)) {
              el.classList.add("is-active-li");
              return true;
            }
            el.classList.remove("is-active-li");
          });
        }, 50);
      },
    };
  }

  initTocBot() {
    if (!this.state || !this.state.result || !document.querySelector("nav"))
      return;
    tocbot.destroy();
    tocbot.init(this.getTocBotOptions());
    this.setState({
      tocInitialized: true,
    });
  }

  getPatientResource() {
    if (!this.state.collector) return null;
    const patientResource = this.state.collector.find(
      (item) =>
        item.data &&
        item.data.resourceType &&
        item.data.resourceType.toLowerCase() === "patient"
    );
    if (patientResource) return patientResource.data;
    return null;
  }

  getPatientId() {
    if (this.state.patientId) return this.state.patientId;
    if (!this.state.collector) return "";
    const patientResource = this.getPatientResource();
    if (patientResource) return patientResource.id;
    return "";
  }
  getPatientName() {
    const summary = this.state.result ? this.state.result.Summary : null;
    const patientName = summary && summary.Patient ? summary.Patient.Name : "";
    if (patientName) return patientName;
    return getPatientNameFromSource(this.getPatientResource());
  }
  initProcessProgressDisplay() {
    this.clearProcessInterval();
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
  getOverviewSectionKey() {
    return "PatientRiskOverview";
  }
  setError(message) {
    if (!message) return;
    this.setState({
      errorCollection: [...this.state.errorCollection, message],
    });
  }
  logError(message) {
    if (!message) return;
    writeToLog(message, "error", this.getPatientLogParams());
  }

  getPatientLogParams() {
    // see https://github.com/uwcirg/logserver for recommended params
    return {
      patientName: this.getPatientName(),
      subject: `Patient/${this.getPatientId()}`,
      "epic-patient-id": getEPICPatientIdFromSource(this.getPatientResource()),
    };
  }
  //save MME calculations to file for debugging purpose, development environment ONLY
  savePDMPSummaryData() {
    if (isProduction()) return;
    const summary = this.state.result ? this.state.result.Summary : null;
    if (!summary) return;
    const patientName = this.getPatientName();
    const fileName = patientName.replace(/\s/g, "_") + "_MME_Result";
    landingUtils.savePDMPSummaryData(summary, fileName);
  }

  hasOverviewSection() {
    return summaryMap && summaryMap[this.getOverviewSectionKey()];
  }

  setSummaryAlerts(summary, sectionFlags) {
    if (!this.hasOverviewSection()) return;
    summary[this.getOverviewSectionKey() + "_alerts"] =
      landingUtils.getProcessedAlerts(sectionFlags, {
        tags: ["alert"],
        ...this.getPatientLogParams(),
      });
  }
  setSummaryGraphData(summary) {
    if (!this.hasOverviewSection()) return;
    //process graph data
    const overviewSection = summaryMap[this.getOverviewSectionKey()];
    summary[this.getOverviewSectionKey() + "_graph"] =
      landingUtils.getSummaryGraphDataSet(overviewSection.graphConfig, summary);
  }

  setSummaryOverviewStatsData(summary) {
    if (!this.hasOverviewSection()) return;
    const overviewSection = summaryMap[this.getOverviewSectionKey()];
    const stats = landingUtils.getProcessedStatsData(
      overviewSection.statsConfig,
      summary
    );
    summary[this.getOverviewSectionKey() + "_stats"] = stats;
  }

  handleSetActiveTab(index) {
    this.setState(
      {
        activeTab: index,
      },
      () => {
        this.initTocBot();
        writeToLog(index >= 1 ? "report tab" : "overview tab", "info", {
          tags: ["tab"],
          ...this.getPatientLogParams(),
        });

        window.scrollTo(0, 1);
      }
    );
  }

  shouldShowTabs() {
    const tabs = this.getTabs();
    return tabs && tabs.length > 1;
  }

  getTabs() {
    let tabs = ["overview"];
    if (isReportEnabled()) tabs.push("report");
    return tabs;
  }

  renderHeader(summary, patientResource, PATIENT_SEARCH_URL) {
    const summaryPatient = summary.Patient;
    return (
      <Header
        patientName={this.getPatientName()}
        patientDOB={datishFormat(this.state.result, patientResource?.birthDate)}
        patientGender={summaryPatient?.Gender}
        meetsInclusionCriteria={summaryPatient?.MeetsInclusionCriteria}
        patientSearchURL={PATIENT_SEARCH_URL}
        siteID={getSiteId()}
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
        hasMmeErrors={this.state.hasMmeErrors}
        result={this.state.result}
      />
    );
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
                  <Report
                    summaryData={{
                      report: summary.ReportSummary,
                      survey: summary.SurveySummary,
                    }}
                    sectionFlags={sectionFlags}
                  ></Report>
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
          <FontAwesomeIcon icon={faExclamationCircle} title="error" /> Error:
          See console for details.
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

    if (!this.state || this.state.result == null) {
      return this.renderError(getPatientSearchURL(!!getTokenInfoFromStorage()));
    }
    const patientResource = this.getPatientResource();
    const summary = this.state.result.Summary;
    const { sectionFlags } = this.state;

    return (
      <div className="landing">
        <div id="anchorTop" ref={this.anchorTopRef}></div>
        <div id="skiptocontent"></div>
        {isNotProduction() && (
          <SystemBanner type={getEnvSystemType()}></SystemBanner>
        )}
        {this.renderHeader(summary, patientResource, getPatientSearchURL(true))}
        <div className="warpper">
          {this.renderTabs()}
          {this.renderTabPanels(summary, sectionFlags)}
        </div>
        {/* <ReactTooltip className="summary-tooltip" id="summaryTooltip" /> */}
      </div>
    );
  }
}
