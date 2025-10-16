import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { FhirClientContext } from "../../context/FhirClientContext";
import executeElm, {
  extractPatientResourceFromFHIRBundle,
} from "../../utils/executePainFactorsELM";
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
import { refreshTocBot } from "../../config/tocbot_config";

import { getEnvs, fetchEnvData } from "../../utils/envConfig";
import SystemBanner from "../SystemBanner";
import Header from "../Header";
import Report from "../Report";
import Summary from "../Summary";
import Spinner from "../../elements/Spinner";
//import CopyPaste from "./report/CopyPaste";

let processIntervalId = 0;
let scrollHeaderIntervalId = 0;

export default class Landing extends Component {
  static contextType = FhirClientContext;
  constructor() {
    super(...arguments);
    this.state = {
      result: null,
      loading: true,
      collector: [],
      resourceTypes: {},
      patientId: "",
      activeTab: 0,
      tabsActivated: [],
      loadingMessage: "Resources are being loaded...",
      hasMmeErrors: false,
      mmeErrors: [],
      errorCollection: [],
      summaryMap: summaryMap,
    };

    // This binding is necessary to make `this` work in the callback
    this.handleSetActiveTab = this.handleSetActiveTab.bind(this);
    this.handleHeaderPos = this.handleHeaderPos.bind(this);
    this.headerPosEvent = this.headerPosEvent.bind(this);
    this.handleAccessToEducationMaterial =
      this.handleAccessToEducationMaterial.bind(this);

    this.containerRef = React.createRef();
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
    // display resources loading statuses
    this.initProcessProgressDisplay();
    const { client, patient, error } = this.context;

    if (error) {
      this.setError(err);
      return;
    }
    Promise.allSettled([
      executeElm(
        client,
        patient,
        this.state.collector,
        this.state.resourceTypes
      ),
      landingUtils.getExternalData(summaryMap),
      // fetch env data where necessary, i.e. env.json, to ensure REACT env variables are available
      fetchEnvData(),
    ])
      .then((responses) => {
        if (!getTokenInfoFromStorage()) {
          console.log("No access token found");
          this.handleNoAccessToken();
          return;
        }
        // write out environment variables:
        getEnvs();
        if (responses[1].status === "rejected") {
          this.clearProcessInterval();
          const rejectReason = responses[0].reason
            ? responses[0].reason
            : "Error retrieving patient data.";
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
        let fhirData = responses[0]?.value;
        let externalDataSet = responses[1]?.value;
        // hide and show section(s) depending on config
        const currentSummaryMap = {
          ...this.state.summaryMap,
          ...landingUtils.getSummaryMapWithUpdatedSectionsVis(
            this.state.summaryMap
          ),
        };
        result["bundle"] = fhirData?.bundle;
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
            this.clearProcessInterval();
            this.initEvents();
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

  componentWillUnmount() {
    this.clearProcessInterval();
    this.removeEvents();
  }

  componentDidUpdate(prevProps, prevState) {
    //page title
    document.title = "COSRI";
    if (this.shouldShowTabs()) {
      // for styling purpose
      document.querySelector("body").classList.add("has-tabs");
    }

    if (
      prevState.activeTab !== this.state.activeTab &&
      this.isTabActivated(this.state.activeTab)
    ) {
      refreshTocBot();
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
    //const logParams = this.getPatientLogParams();
    this.containerRef.current.addEventListener(
      "click",
      this.handleAccessToEducationMaterial
    );
    this.handleHeaderPos();
    // support other events if need to
  }

  removeEvents() {
    document.removeEventListener("scroll", this.headerPosEvent);
    this.containerRef.current.removeEventListener(
      "click",
      this.handleAccessToEducationMaterial
    );
  }

  handleAccessToEducationMaterial(event) {
    const logParams = this.getPatientLogParams();
    if (
      event.target.classList.contains(".education") ||
      event.target.closest(".education")
    ) {
      const title =
        event.target?.innerText ?? event.target?.getAttribute("href");
      if (!title) return;
      writeToLog(`Education material: ${title}`, "info", {
        tags: ["education"],
        ...logParams,
      });
    }
  }

  headerPosEvent() {
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
  }

  // fixed header when scrolling in the event that it is not within viewport
  handleHeaderPos() {
    document.addEventListener("scroll", this.headerPosEvent);
  }

  getPatientResource() {
    if (this.context.patient) return this.context.patient;
    return extractPatientResourceFromFHIRBundle(this.state.result?.bundle);
  }

  getPatientId() {
    if (this.state.patientId) return this.state.patientId;
    return this.context.patient?.id;
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
    const mmeData = landingUtils.getSummaryGraphDataSet(overviewSection.graphConfig, summary);
    summary[this.getOverviewSectionKey() + "_graph"] = mmeData;
    summary["dailyMMEData"] = landingUtils.getDailyMMEData(mmeData);
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
    writeToLog(index >= 1 ? "report tab" : "overview tab", "info", {
      tags: ["tab", "analytics"],
      ...this.getPatientLogParams(),
    });
    if (this.state.activeTab === index) {
      return;
    }
    if (!this.isTabActivated(index)) {
      this.setState(
        (prevState) => ({
          activeTab: index,
          tabsActivated: [...prevState.tabsActivated, index],
        }),
        () => {
          window.scrollTo(0, 1);
        }
      );
    } else {
      this.setState({ activeTab: index }, () => {
        window.scrollTo(0, 1);
      });
    }
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
  isTabActivated(index) {
    return this.state.tabsActivated.indexOf(index) !== -1;
  }

  renderHeader(summary, patientResource, PATIENT_SEARCH_URL) {
    const summaryPatient = summary.Patient;
    return (
      <Header
        patientName={this.getPatientName()}
        patientDOB={datishFormat(this.state.result, patientResource?.birthDate)}
        patientGender={summaryPatient?.Gender}
        patientMRN={summaryPatient?.MRN}
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
              onClick={(e) => {
                const parentTab = e.target.closest(".tab");
                if (parentTab) parentTab.classList.add("active");
                this.handleSetActiveTab(index);
              }}
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
                    patientBundle={this.state.result?.bundle}
                    sectionFlags={sectionFlags}
                    onReportLoaded={(data) =>
                      this.setState({
                        result: {
                          ...this.state.result,
                          Summary: {
                            ...this.state.result.Summary,
                            ...data,
                          },
                        },
                      })
                    }
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
      <div className="landing" ref={this.containerRef}>
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
      </div>
    );
  }
}
