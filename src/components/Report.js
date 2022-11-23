import React, { Component } from "react";
import ReactModal from "react-modal";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Collapsible from "react-collapsible";
import InfoModal from "./InfoModal";
import ResponsesSummary from "./ResponsesSummary";
import ScoringSummary from "./ScoringSummary";
import SideNav from "./SideNav";
import SurveyGraph from "./graph/SurveyGraph";
import reportSummarySections from "../config/report_config";

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

  getGraphData(summaryData) {
    if (!summaryData) return [];
    let data = [];
    summaryData.forEach((item) => {
      if (!item.ResponsesSummary) return true;
      const surveyData = item.ResponsesSummary.map((o) => {
        o.qid = item.QuestionnaireName;
        return o;
      });
      data = [...data, ...surveyData];
    });
    return data;
  }

  renderSectionHeader(section) {
    return (
      <h2 id={`${section.dataKey}_section`} className="section__header">
        <div className="section__header-title">
          {section.icon && <span title={section.title}>{section.icon}</span>}
          <div className="section__header-title">{section.title}</div>
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
    return (
      <div className="section">
        {/* {section.subtitle && <div>{section.subtitle}</div>} */}
        {section.sections.map((item, index) => {
          const matchedData = summaryData.filter(o => o.dataKey === item.dataKey)[0];
          return (
            <div
              className="sub-section"
              key={`subsection_${item.dataKey}_${index}`}
            >
              {this.renderSubSectionHeader(item)}
              {item.renderComponent === "ResponsesSummary" && (
                <ResponsesSummary summary={matchedData}></ResponsesSummary>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  renderSubSectionHeader(item) {
    return (
      <h3 id={`${item.dataKey}_title`} className="sub-section__header">
        {this.renderSubSectionTitle(item)}
        {this.renderSubSectionInfo(item)}
      </h3>
    );
  }
  renderSubSectionTitle(item) {
    return (
      <span className="sub-section__header__name">
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
  renderSubSectionInfo(item) {
    return (
      <span className="sub-section__header__info">
        {item.description && (
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
        )}
      </span>
    );
  }
  
  renderTopPanel(summaryData) {
    return (
      <div className="panel-container">
        <div className="panel graph">
          <SurveyGraph data={this.getGraphData(summaryData)}></SurveyGraph>
        </div>
        <div className="panel">
          {/* <div className="panel__item">Alerts go here</div> */}
          <div className="panel__item">
            <ScoringSummary summary={summaryData}></ScoringSummary>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { summaryData } = this.props;
    return (
      <div className="report summary">
        <SideNav
          id="reportSideNavButton"
        ></SideNav>
        <div className="summary__display">
          {this.renderTopPanel(summaryData)}
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
          </div>
        </div>
        <ReactModal
          className="modal"
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
