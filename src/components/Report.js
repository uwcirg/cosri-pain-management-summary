import React, { Component } from "react";
import ReactModal from "react-modal";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Collapsible from "react-collapsible";
import InfoModal from "./InfoModal";
import SideNav from "./SideNav";
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

  renderSectionHeader(section) {
    console.log("section ", section)
    return (
      <h2 id={`${section.dataKey}`} className="section__header">
        <div className="section__header-title">
          {section.icon && <span title={section.title}>{section.icon()}</span>}
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
    if (section.component) return <div className="section">{section.component({summary: summaryData})}</div>;
    if (!section.sections || !section.sections.length) return null;
    return (
      <div className="section">
        {section.sections.map((item, index) => {
          const matchedData = summaryData && summaryData.length ? summaryData.filter(
            (o) => o.dataKey === item.dataKey
          )[0]: null;
          return (
            <div
              className="sub-section"
              key={`subsection_${item.dataKey}_${index}`}
            >
              {this.renderSubSectionHeader(item)}
              {item.component && item.component({summary: matchedData})}
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

  render() {
    const { summaryData } = this.props;
    return (
      <div className="report summary">
        <SideNav id="reportSideNavButton"></SideNav>
        <div className="summary__display">
          {/* {this.renderTopPanel(summaryData)} */}
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
