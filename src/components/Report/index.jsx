import React, { Component } from "react";
import ReactModal from "react-modal";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Collapsible from "react-collapsible";
import ErrorBanner from "../ErrorBanner";
import InfoModal from "../InfoModal";
import SideNav from "../SideNav";
import Spinner from "../../elements/Spinner";
import Version from "../../elements/Version";
import executeReportELM from "../../utils/executeReportELM";
import reportSummarySections from "../../config/report_config";
import { initTocBot, destroyTocBot } from "../../config/tocbot_config";
import { getProcessProgressDisplay } from "../Landing/utility";
import {
  dedupArrObjects,
  getQuestionnaireDescription,
  getQuestionnaireTitle,
  isEmptyArray,
  isReportEnabled,
} from "../../helpers/utility";
import * as reportUtil from "./utility";

let progressIntervalId = 0;

export default class Report extends Component {
  constructor() {
    super(...arguments);

    this.state = {
      summaryData: null,
      loading: true,
      loadingMessage: "Loading report data",
      collector: [],
      resourceTypes: {},
      errors: [],
      showModal: false,
      modalSubSection: null,
    };

    ReactModal.setAppElement("body");
  }

  componentWillUnmount() {
    destroyTocBot();
    this.clearProcessInterval();
  }

  componentDidMount() {
    if (!this.state.loading || this.state.summaryData) {
      this.initializeTocBot();
      return;
    }
    this.initProcessProgressDisplay();
    executeReportELM(
      this.props.patientBundle,
      this.state.collector,
      this.state.resourceTypes
    )
      .then((results) => {
        console.log("query result for report ", results);
        this.setState(
          {
            summaryData: {
              report: results?.ReportSummary,
              survey: results?.SurveySummary,
            },
            loading: false,
            errors: [...this.state.errors, ...this.getErrorsFromCollector()],
          },
          () => {
            this.clearProcessInterval();
            this.initializeTocBot();
          }
        );
      })
      .catch((e) => {
        console.log(e);
        this.clearProcessInterval();
        this.setState({
          loading: false,
          errors: [...this.state.errors, e],
        });
      });
  }

  initProcessProgressDisplay() {
    this.clearProcessInterval();
    progressIntervalId = setInterval(() => {
      this.setState({
        loadingMessage: getProcessProgressDisplay(
          this.state.resourceTypes
        ),
      });
    }, 30);
  }
  clearProcessInterval() {
    clearInterval(progressIntervalId);
  }

  initializeTocBot() {
    if (!document.querySelector(".active nav")) return;
    destroyTocBot();
    const MIN_HEADER_HEIGHT = 180;
    initTocBot({
      tocSelector: `.active .summary__nav`, // where to render the table of contents
      contentSelector: `.active .summary__display`, // where to grab the headings to build the table of contents
      positionFixedSelector: `.active .summary__nav`, // element to add the positionFixedClass to
      headingsOffset: 1 * MIN_HEADER_HEIGHT,
      scrollSmoothOffset: -1 * MIN_HEADER_HEIGHT,
    });
  }

  getErrorsFromCollector() {
    if (isEmptyArray(this.state.collector)) return [];
    return this.state.collector
      .filter((item) => !!item.error)
      .map((item) => `${item.type ?? ""}${item.type ? ": " : ""}${item.error}`);
  }

  handleOpenModal = (modalSubSection, event) => {
    //only open modal on 'enter' or click
    event.stopPropagation();
    if (event.keyCode === 13 || event.type === "click") {
      this.setState({ showModal: true, modalSubSection });
    }
  };

  handleCloseModal = () => {
    this.setState({ showModal: false });
  };

  hasSummaryData(summaryData) {
    if (!summaryData) return false;
    return !!(
      reportUtil.hasReportSummaryData(summaryData.report) ||
      reportUtil.hasSurveySummaryData(summaryData.survey)
    );
  }

  getScoringData(summaryData) {
    return reportUtil.getScoringData(summaryData);
  }
  getGraphData(summaryData) {
    return reportUtil.getGraphData(summaryData);
  }
  getBodyDiagramDataData(summaryData) {
    return reportUtil.getBodyDiagramData(summaryData);
  }

  renderSectionAnchor(sectionId) {
    const anchorID = String(sectionId).toUpperCase();
    return (
      <div
        id={`${anchorID}__anchor`}
        name={`${anchorID}__anchor`}
        style={{
          position: "relative",
          top: "-148px",
          height: "2px",
        }}
      ></div>
    );
  }

  renderSectionHeader(section) {
    const sectionKey = String(section.dataKey).toUpperCase();
    return (
      <div key={`sectionHeader_container_${section}`}>
        {this.renderSectionAnchor(sectionKey)}
        <h2
          id={`${sectionKey}_section`}
          className={`section__header ${
            section.showHeaderInPrint ? "print-header" : ""
          }`}
        >
          <div className="section__header-title" datasectionid={sectionKey}>
            {section.icon && (
              <span title={section.title}>{section.icon()}</span>
            )}
            <span className="title-text-container">
              <span className="title-text">{section.title}</span>
            </span>
          </div>
          <FontAwesomeIcon
            className="chevron"
            icon="chevron-right"
            title="expand/collapse"
          />
        </h2>
      </div>
    );
  }
  getSectionFlags(section) {
    if (isEmptyArray(section.flags)) return null;
    const sectionFlags = this.props.sectionFlags;
    if (!sectionFlags) return null;
    return dedupArrObjects(
      section.flags
        .map((o) => {
          if (
            sectionFlags[o.parentKey] &&
            sectionFlags[o.parentKey][o.dataKey]
          ) {
            return sectionFlags[o.parentKey][o.dataKey];
          }
          return null;
        })
        .filter((o) => !!o)
        .flat()
        .map((o) => {
          return {
            flagText: o.flagText,
            flagClass: o.flagClass,
          };
        }),
      "flagText"
    );
  }
  renderFlagIconsInHeader(section) {
    const flagObj = this.getSectionFlags(section);
    if (isEmptyArray(flagObj)) return null;
    return (
      <div className="flags-container rows">
        {flagObj.map((o, index) => {
          return (
            <div
              key={`${section.dataKey}_flag_${index}`}
              className="flag-item"
              title={o.flagText}
            >
              <FontAwesomeIcon
                className={`flag ${o.flagClass}`}
                icon="exclamation-circle"
                key={`${section.dataKey}_flagicon_${index}`}
              />
            </div>
          );
        })}
      </div>
    );
  }
  renderSectionBody(summaryData, section) {
    const surveySummaryData = reportUtil.getSurveySummaryData(summaryData);
    const scoringData = this.getScoringData(surveySummaryData);
    const graphData = this.getGraphData(scoringData);
    const bodyDiagramData = this.getBodyDiagramDataData(surveySummaryData);
    const reportData = reportUtil.getReportSummaryData(summaryData);
    const procedureData = reportUtil.getProcedureData(reportData);
    const referralData = reportUtil.getReferralData(reportData);
    const propData = {
      surveyData: surveySummaryData,
      scoringData: scoringData,
      graphData: graphData,
      bodyDiagramData: bodyDiagramData,
      procedureData: procedureData,
      referralData: referralData,
      reportData: reportData,
      medicationListData: reportUtil.getMedicationListData(reportData),
      sectionFlags: this.props.sectionFlags,
    };
    if (section.component) {
      return <div className="section">{section.component(propData)}</div>;
    }
    if (!section.sections || !section.sections.length) return null;
    return (
      <div className="section">
        {section.sections.map((item, index) => {
          const matchedData = !isEmptyArray(surveySummaryData)
            ? surveySummaryData.find(
                (summaryDataItem) =>
                  String(summaryDataItem.QuestionnaireKey).toLowerCase() ===
                  String(item.dataKey).toLowerCase()
              )
            : null;
          return (
            <div
              className="sub-section"
              key={`subsection_${item.dataKey}_${index}`}
            >
              {this.renderSubSectionHeader(item, matchedData)}
              {item.component &&
                item.component({
                  ...propData,
                  surveyData: matchedData,
                })}
              {this.renderSubSectionAnchor(item)}
              {this.renderSubSectionFlags(item)}
            </div>
          );
        })}
      </div>
    );
  }
  renderSubSectionAnchor(item) {
    return (
      <div
        id={`${item.dataKey}_anchor`}
        className="sub-section__anchor"
        key={`${item.dataKey}_anchor`}
      ></div>
    );
  }
  renderSubSectionHeader(item, summaryData) {
    const itemKey = String(item.dataKey).toUpperCase();
    return (
      <React.Fragment key={`sub-section_header_container_${itemKey}`}>
        {this.renderSectionAnchor(itemKey)}
        <h3
          datasectionid={itemKey}
          id={`${itemKey}_title`}
          className="sub-section__header"
        >
          {this.renderSubSectionTitle(item, summaryData)}
          {this.renderSubSectionInfo(item, summaryData)}
          {this.renderFlagIconsInHeader(item)}
        </h3>
      </React.Fragment>
    );
  }
  renderSubSectionFlags(section) {
    const flagObj = this.getSectionFlags(section);
    if (isEmptyArray(flagObj)) return null;
    return (
      <div className="flags-container">
        {flagObj.map((o, index) => {
          return (
            <div key={`${section.dataKey}_flag_${index}`} className="flag-item">
              <FontAwesomeIcon
                className={`flag ${o.flagClass}`}
                icon="exclamation-circle"
              />
              <span>{o.flagText}</span>
            </div>
          );
        })}
      </div>
    );
  }
  renderSubSectionTitle(item, summaryData) {
    const title = summaryData?.Questionnaire
      ? getQuestionnaireTitle(summaryData?.Questionnaire)
      : item.title;
    return (
      <span
        className="sub-section__header__name"
        // style={{ fontWeight: 700, fontSize: "1.1em" }}
        datasectionid={String(item.dataKey).toUpperCase()}
      >
        {/* <FontAwesomeIcon
          className={`flag flag-nav`}
          icon={"circle"}
          title="flag"
          tabIndex={0}
        /> */}
        {title}
      </span>
    );
  }
  renderSubSectionInfo(sectionItem, summaryData) {
    if (!summaryData) return null;
    if (!summaryData.Questionnaire) return null;
    if (!sectionItem) return null;
    let item = sectionItem;
    item.description =
      getQuestionnaireDescription(summaryData.Questionnaire) ??
      sectionItem.description;
    item.name = getQuestionnaireTitle(summaryData.Questionnaire);

    if (!item.description) return null;

    return (
      <span className="sub-section__header__info">
        <div
          onClick={(event) => this.handleOpenModal(item, event)}
          onKeyDown={(event) => this.handleOpenModal(item, event)}
          role="button"
          tabIndex={0}
          aria-label={item.dataKey}
        >
          <span
            className="info-icon"
            icon="info-circle"
            title={`more info: ${
              item.dataKey ?? getQuestionnaireTitle(summaryData?.Questionnaire)
            }`}
            role="tooltip"
          >
            more info
          </span>
        </div>
      </span>
    );
  }

  renderNoDataNotice() {
    const defaultMessage =
      "The system indicates that there is no reportable data for this patient.";
    const message = isReportEnabled()
      ? "No PainTracker or UW Medicine procedures, referrals or medications found for this patient. If the patient registered to PainTracker today, request PainTracker data from front desk staff."
      : defaultMessage;

    return (
      <div className="flex flex-start summary__notice flex-gap-1">
        <FontAwesomeIcon icon="exclamation-circle" title="notice" />
        {message}
      </div>
    );
  }

  renderSections(summaryData) {
    return reportSummarySections.map((section, index) => {
      if (section.status === "inactive") return null;
      return (
        <Collapsible
          trigger={this.renderSectionHeader(section)}
          open={true}
          key={index}
        >
          {this.renderSectionBody(summaryData, section)}
        </Collapsible>
      );
    });
  }

  renderInfoModal() {
    return (
      <ReactModal
        className="modal report-info-modal"
        overlayClassName="overlay"
        isOpen={this.state.showModal}
        onRequestClose={this.handleCloseModal}
        contentLabel="More Info"
      >
        <InfoModal
          closeModal={this.handleCloseModal}
          subSection={this.state.modalSubSection}
        />
      </ReactModal>
    );
  }

  render() {
    const summaryData = this.state.summaryData;
    const hasNoData = !this.hasSummaryData(summaryData);
    return (
      <div className="summary report">
        <SideNav id="reportSideNavButton"></SideNav>
        <div className="summary__display">
          {this.state.loading && (
            <Spinner loadingMessage={this.state.loadingMessage}></Spinner>
          )}
          {!this.state.loading && hasNoData && this.renderNoDataNotice()}
          {!this.state.loading && (
            <div className="sections">
              <ErrorBanner errors={this.state.errors}></ErrorBanner>
              {this.renderSections(summaryData)}
              <Version />
              {this.renderInfoModal()}
            </div>
          )}
        </div>
      </div>
    );
  }
}

Report.propTypes = {
  summaryData: PropTypes.object,
  sectionFlags: PropTypes.object,
  onReportLoaded: PropTypes.func,
};
