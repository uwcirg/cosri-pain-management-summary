import React, { Component } from "react";
import ReactModal from "react-modal";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Collapsible from "react-collapsible";
import InfoModal from "../InfoModal";
import SideNav from "../SideNav";
import Version from "../../elements/Version";
import reportSummarySections from "../../config/report_config";
import {
  getQuestionnaireDescription,
  isEmptyArray,
} from "../../helpers/utility";
import * as reportUtil from "./utility";

export default class Report extends Component {
  constructor() {
    super(...arguments);

    this.state = {
      showModal: false,
      modalSubSection: null,
    };

    ReactModal.setAppElement("body");
  }

  handleOpenModal = (modalSubSection, event) => {
    //only open modal on 'enter' or click
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
        </h3>
      </React.Fragment>
    );
  }
  renderSubSectionTitle(item, summaryData) {
    const title = summaryData?.Questionnaire?.title?.value??item.title;
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
            title={`more info: ${item.dataKey}`}
            role="tooltip"
          >
            more info
          </span>
        </div>
      </span>
    );
  }

  renderNoDataNotice() {
    return (
      <div className="flex flex-start summary__notice">
        <FontAwesomeIcon icon="exclamation-circle" title="notice" />
        The system indicates that there is no reportable data for this patient.
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
    const { summaryData } = this.props;
    const hasNoData = !this.hasSummaryData(summaryData);
    return (
      <div className="summary report">
        <SideNav id="reportSideNavButton"></SideNav>
        <div className="summary__display">
          {hasNoData && this.renderNoDataNotice()}
          <div className="sections">
            {this.renderSections(summaryData)}
            <Version />
          </div>
          {this.renderInfoModal()}
        </div>
      </div>
    );
  }
}

Report.propTypes = {
  summaryData: PropTypes.object,
};
