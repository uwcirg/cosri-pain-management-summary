import React, { Component } from "react";
import ReactModal from "react-modal";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Collapsible from "react-collapsible";
import InfoModal from "./InfoModal";
import SideNav from "./SideNav";
import Version from "../elements/Version";
import reportSummarySections from "../config/report_config";
import { getQuestionnaireDescription } from "../helpers/utility";

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
    //only open modal   on 'enter' or click
    if (event.keyCode === 13 || event.type === "click") {
      this.setState({ showModal: true, modalSubSection });
    }
  };

  handleCloseModal = () => {
    this.setState({ showModal: false });
  };

  renderSectionHeader(section) {
    return (
      <h2 id={`${section.dataKey}_section`} className="section__header">
        <div className="section__header-title">
          {section.icon && <span title={section.title}>{section.icon()}</span>}
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
    );
  }
  renderSectionBody(summaryData, section) {
    if (section.component)
      return (
        <div className="section">
          {section.component({ summary: summaryData })}
        </div>
      );
    if (!section.sections || !section.sections.length) return null;
    return (
      <div className="section">
        {section.sections.map((item, index) => {
          const matchedData =
            summaryData && summaryData.length
              ? summaryData.filter(
                  (o) =>
                    String(o.QuestionnaireName).toLowerCase() ===
                    String(item.dataKey).toLowerCase()
                )[0]
              : null;
          return (
            <div
              className="sub-section"
              key={`subsection_${item.dataKey}_${index}`}
            >
              {this.renderSubSectionHeader(item, matchedData)}
              {item.component && item.component({ summary: matchedData })}
              {this.renderSubSectionAnchor(item)}
            </div>
          );
        })}
      </div>
    );
  }
  renderSubSectionAnchor(item) {
    return (
      <div id={`${item.dataKey}_anchor`} className="sub-section__anchor"></div>
    );
  }
  renderSubSectionHeader(item, summaryData) {
    return (
      <h3 id={`${item.dataKey}_title`} className="sub-section__header">
        {this.renderSubSectionTitle(item)}
        {this.renderSubSectionInfo(item, summaryData)}
      </h3>
    );
  }
  renderSubSectionTitle(item) {
    return (
      <span
        className="sub-section__header__name"
        style={{ fontWeight: 700, fontSize: "1.1em" }}
      >
        <FontAwesomeIcon
          className={`flag flag-nav`}
          icon={"circle"}
          title="flag"
          tabIndex={0}
        />
        {item.title}
      </span>
    );
  }
  renderSubSectionInfo(sectionItem, summaryData) {
    if (!summaryData) return null;
    let item = sectionItem;
    item.description = getQuestionnaireDescription(summaryData.Questionnaire);

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
        The system indicates that there is no reportable data for this patient. If you
        believe this is an error, please contact us.
      </div>
    );
  }

  render() {
    const { summaryData } = this.props;
    const hasNoData =
      !summaryData ||
      !summaryData.length ||
      !summaryData.find(
        (item) => item.ResponsesSummary && item.ResponsesSummary.length
      );
    console.log("summaryData ", summaryData);
    return (
      <div className="report summary">
        <SideNav id="reportSideNavButton"></SideNav>
        <div className="summary__display">
          {hasNoData && this.renderNoDataNotice()}
          <div className="sections">
            {reportSummarySections.map((section, index) => {
              return (
                <Collapsible
                  trigger={this.renderSectionHeader(section)}
                  open={true}
                  key={index}
                >
                  {this.renderSectionBody(summaryData, section)}
                </Collapsible>
              );
            })}
            <Version />
          </div>
        </div>
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
      </div>
    );
  }
}

Report.propTypes = {
  summaryData: PropTypes.array,
};
