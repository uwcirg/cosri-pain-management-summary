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
let tocbotTntervalId = 0;

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
      activeTab: null,
      loadingMessage: "Resources are being loaded...",
      hasMmeErrors: false,
      mmeErrors: [],
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
    this.initProcessProgressDisplay();
    // hide section(s) per config
    this.setSectionsVis();
    let result = {};
    executeElm(this.state.collector, this.state.resourceTypes)
      .then((response) => {
        writeToLog("application loaded", "info", {
          patientName: this.getPatientName(),
        });
        //set FHIR results
        let fhirData = response;
        result["Summary"] = fhirData ? { ...fhirData["Summary"] } : {};
        //add data from other sources, e.g. education materials
        landingUtils
          .getExternalData(summaryMap, this.getPatientId())
          .then((externalDataSet) => {
            console.log("external data ", externalDataSet);
            result["Summary"] = {
              ...result["Summary"],
              ...(externalDataSet ? externalDataSet["data"] : null),
            };
            const { sectionFlags, flaggedCount } =
              landingUtils.getProcessedSummaryData(result.Summary, summaryMap);
            this.setSummaryOverviewStatsData(result["Summary"]);
            if (summaryMap[this.getOverviewSectionKey()]) {
              this.setSummaryAlerts(result["Summary"], sectionFlags);
            }
            this.setSummaryGraphData(result["Summary"]);
            const collectorErrors = this.getCollectorErrors();
            collectorErrors.forEach((e) => this.writeError(e));
            const { errors, hasMmeErrors, mmeErrors } = this.getSummaryErrors(
              result.Summary
            );
            landingUtils.logMMEEntries(result.Summary, {
              tags: ["mme-calc"],
              patientName: this.getPatientName(),
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
            this.setState(
              {
                result,
                sectionFlags,
                flaggedCount,
                loading: false,
                activeTab: 0,
                patientId: this.getPatientId(),
                hasMmeErrors: hasMmeErrors,
                mmeErrors: mmeErrors,
                errorCollection: [
                  ...this.state.errorCollection,
                  ...collectorErrors,
                  ...errors,
                  ...(hasExternalDataError
                    ? Object.values(externalDataSet["errors"])
                    : []),
                ],
                summaryMap: this.getSummaryMapIncludingErrors(
                  summaryMap,
                  hasExternalDataError ? externalDataSet["error"] : null
                ),
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

    if (!this.state.tocInitialized) this.initTocBot();
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
    tocbot.destroy();
    tocbot.init(this.getTocBotOptions());
    this.setState({
      tocInitialized: true,
    });
  }

  getPatientId() {
    if (this.state.patientId) return this.state.patientId;
    if (!this.state.collector) return "";
    let patientBundle = this.state.collector.filter(
      (item) =>
        item.data &&
        item.data.resourceType &&
        item.data.resourceType.toLowerCase() === "patient"
    );
    if (patientBundle.length) {
      return patientBundle[0].data.id;
    }
  }
  getPatientName() {
    const summary = this.state.result ? this.state.result.Summary : null;
    const patientName = summary && summary.Patient ? summary.Patient.Name : "";
    return patientName;
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
  getCollectorErrors() {
    let collectorErrors = this.state.collector.filter((item) => {
      return item.error;
    });
    let errors = [];
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
      errors.push(`${sourceTypeText} ${item.error}`);
    });
    return errors;
  }

  getSummaryErrors(summary) {
    if (!summary)
      return {
        errors: [],
        hasMmeErrors: false,
        mmeErrors: [],
      };
    //compile error(s) related to MME calculations
    let mmeErrors = landingUtils.getMMEErrors(summary);

    // the rest of the errors
    let errors = [];
    for (let section in summary) {
      if (summary[section].error) {
        errors.push(summary[section].error);
      }
    }
    return {
      errors: errors,
      hasMmeErrors: !!(mmeErrors && mmeErrors.length),
      mmeErrors: mmeErrors,
    };
  }
  setError(message) {
    if (!message) return;
    this.setState({
      errorCollection: [...this.state.errorCollection, message],
    });
  }
  writeError(message) {
    if (!message) return;
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
        ...landingUtils.getSummaryMapWithUpdatedSectionsVis(
          this.state.summaryMap
        ),
      },
    });
  }

  getSummaryMapIncludingErrors(summaryMap, oErrors) {
    if (!oErrors) return summaryMap;
    let updatedMap = Object.create(summaryMap);
    for (let key in updatedMap) {
      updatedMap[key] = {
        ...updatedMap[key],
        errorMessage: oErrors[key],
      };
    }
    return {
      ...summaryMap,
      ...updatedMap,
    };
  }

  setSummaryAlerts(summary, sectionFlags) {
    summary[this.getOverviewSectionKey() + "_alerts"] =
      landingUtils.getProcessedAlerts(sectionFlags, {
        tags: ["alert"],
        patientName: this.getPatientName(),
      });
  }
  setSummaryGraphData(summary) {
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

  setSummaryOverviewStatsData(summary) {
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

  handleSetActiveTab(index) {
    this.setState(
      {
        activeTab: index,
      },
      () => {
        this.initTocBot();
        window.scrollTo(0, 10)
      }
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

  renderNav(id) {
    const navToggleToolTip = this.state.showNav
      ? "collapse side navigation menu"
      : "expand side navigation menu";
    //const navId = this.props.id ? this.props.id : "sideNavButton";
    const navId = `${id}SideNavButton`;
    return (
      <div
        className={`${this.state.showNav ? "open" : ""} summary__nav-wrapper`}
      >
        <nav className={`summary__nav`}></nav>
        <div
          role="presentation"
          ref={(ref) => (this.navRef = ref)}
          data-for={navId}
          data-tip={navToggleToolTip}
          data-place="right"
          className={`${this.props.navClassName} summary__nav-button close`}
          title="toggle side navigation menu"
          onClick={(e) => {
            ReactTooltip.hide(this.navRef);
            this.handleNavToggle(e);
            //if (this.props.onClick) this.props.onClick();
          }}
        ></div>
        <ReactTooltip className="summary-tooltip" id={navId} />
      </div>
    );
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
