import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Collapsible from "react-collapsible";
import ReactTooltip from "react-tooltip";
import ReactTable from "react-table";
import ReactModal from "react-modal";

import defaultSummaryMap from "../config/summary_config.json";
import * as formatit from "../helpers/formatit";
import * as sortit from "../helpers/sortit";
import { getErrorMessageString } from "../helpers/utility";

import ChartIcon from "../icons/ChartIcon";
import MedicalHistoryIcon from "../icons/MedicalHistoryIcon";
import MedicineIcon from "../icons/MedicineIcon";
import RiskIcon from "../icons/RiskIcon";
import RxIcon from "../icons/RxIcon";
import TreatmentsIcon from "../icons/TreatmentsIcon";
import ProviderIcon from "../icons/ProviderIcon";
import UserIcon from "../icons/UserIcon";
import FlaskIcon from "../icons/FlaskIcon";

import ErrorBanner from "./ErrorBanner";
import InclusionBanner from "./InclusionBanner";
import ExclusionBanner from "./ExclusionBanner";
import DataInfo from "./DataInfo";
import Disclaimer from "./Disclaimer";
import DevTools from "./DevTools";
import InfoModal from "./InfoModal";
import ScoringSummary from "./report/ScoringSummary";
import SideNav from "./SideNav";
import Warning from "./Warning";
import MMEGraph from "./graph/MMEGraph";
import Version from "../elements/Version";

import { getEnv } from "../utils/envConfig";

export default class Summary extends Component {
  constructor() {
    super(...arguments);

    this.state = {
      showModal: false,
      modalSubSection: null,
      activeTab: 0,
    };

    this.elementRef = React.createRef();

    this.subsectionTableProps = { id: "react_sub-section__table" };

    ReactModal.setAppElement("body");
  }

  getSummaryMap() {
    return this.props.summaryMap ?? defaultSummaryMap;
  }

  handleOpenModal = (modalSubSection, event) => {
    //only open modal  on 'enter' or click
    if (event.keyCode === 13 || event.type === "click") {
      this.setState({ showModal: true, modalSubSection });
    }
  };

  handleCloseModal = () => {
    this.setState({ showModal: false });
  };

  getSectionEntryCounts(section) {
    let summary = this.props.summary;
    let count = 0;
    const summaryMap = this.getSummaryMap();
    if (summary[section] && summaryMap[section]["sections"]) {
      let sections = summaryMap[section]["sections"];
      for (let subSection in sections) {
        let dataKeySource = sections[subSection]["dataKeySource"];
        let dataKey = sections[subSection]["dataKey"];
        if (
          summary[dataKeySource] &&
          Object.keys(summary[dataKeySource]).indexOf(dataKey) !== -1
        ) {
          count += summary[dataKeySource][dataKey]
            ? summary[dataKeySource][dataKey].filter((item) => item).length
            : 0;
        }
      }
    }
    return count;
  }

  isSectionFlagged(section) {
    const { sectionFlags } = this.props;
    const subSections = sectionFlags[section]
      ? Object.keys(sectionFlags[section])
      : null;

    if (!subSections) {
      return false;
    }

    for (let i = 0; i < subSections.length; ++i) {
      if (this.isSubsectionFlagged(section, subSections[i])) {
        return true;
      }
    }

    return false;
  }

  getSectionFlagClass(section) {
    const { sectionFlags } = this.props;
    const subSections = sectionFlags[section]
      ? Object.keys(sectionFlags[section])
      : null;

    if (!subSections) {
      return "";
    }

    for (let i = 0; i < subSections.length; ++i) {
      if (this.isSubsectionFlagged(section, subSections[i])) {
        return sectionFlags[section][subSections[i]][0].flagClass;
      }
    }

    return "";
  }

  getSectionFlagCount(section) {
    const { sectionFlags } = this.props;
    const subSections = sectionFlags[section]
      ? Object.keys(sectionFlags[section])
      : null;

    if (!subSections) {
      return false;
    }

    let count = 0;
    for (let i = 0; i < subSections.length; ++i) {
      if (this.isSubsectionFlagged(section, subSections[i])) {
        count += sectionFlags[section][subSections[i]].length;
      }
    }

    return count;
  }

  isSubsectionFlagged(section, subSection) {
    const { sectionFlags } = this.props;
    if (!sectionFlags[section] || !sectionFlags[section][subSection]) {
      return false;
    }
    if (sectionFlags[section][subSection] === true) {
      return true;
    } else if (sectionFlags[section][subSection] === false) {
      return false;
    } else {
      return sectionFlags[section][subSection].length > 0;
    }
  }

  // if flagged, returns flag text, else returns empty text
  getEntryFlagText(section, subSection, entry) {
    const { sectionFlags } = this.props;

    let flagText = "";
    if (!sectionFlags[section][subSection]) return "";
    sectionFlags[section][subSection].forEach((flag) => {
      if (flag.entryId === entry._id) {
        flagText = flag.flagText + (flag.flagClass ? "|" + flag.flagClass : "");
      }
    });

    return flagText;
  }

  renderGuideLine(subSection) {
    if (!subSection) return "";
    let guidelineElement = subSection["guideline"]
      ? subSection["guideline"]
      : null;
    if (!guidelineElement) return "";
    let guidelineContent = "";
    guidelineContent = (
      <div className="guideline-wrapper">
        {guidelineElement.map((item, index) => {
          return (
            <div key={`guideline_${index}`} className={`${item.type}`}>
              {item.title && (
                <span className="text">
                  <b className="title">{item.title}</b>: {item.text}
                </span>
              )}
              {!item.title && <span className="text">{item.text}</span>}
            </div>
          );
        })}
      </div>
    );
    return guidelineContent;
  }

  renderNoEntries(section, subSection) {
    const { sectionFlags } = this.props;
    let subSectionFlags = sectionFlags[section]
      ? sectionFlags[section][subSection.dataKey]
      : null;
    let flagEntries = [];
    let flagContent = "";
    let guidelineContent = this.renderGuideLine(subSection);
    if (subSectionFlags) {
      flagEntries = subSectionFlags.map((flag) => {
        return flag.flagText;
      });
    }
    if (flagEntries.length) {
      flagContent = flagEntries.map((item, index) => {
        return (
          <div key={`flag_${index}`}>
            <FontAwesomeIcon
              className="flag"
              icon="exclamation-circle"
              tabIndex={0}
            />{" "}
            <span className="text">{item}</span>
          </div>
        );
      });
    }
    return (
      <div id={`${subSection.dataKey}_table`} className={`table`}>
        <div className="no-entries">
          <div>no entries found</div>
          <div className="flag-guideline-content">
            <div>{flagContent}</div>
            {guidelineContent && (
              <div className="guideline-content">{guidelineContent}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  renderTable(table, entries, section, subSection, index) {
    // If a filter is provided, only render those things that have the filter field (or don't have it when it's negated)
    let filteredEntries = entries;
    if (table.filter && table.filter.length > 0) {
      // A filter starting with '!' is negated (looking for absence of that field)
      const negated = table.filter[0] === "!";
      const filter = negated ? table.filter.substring(1) : table.filter;
      filteredEntries = entries.filter((e) =>
        negated ? e[filter] == null : e[filter] != null
      );
    }
    if (filteredEntries.length === 0) return null;

    //ReactTable needs an ID for aria-describedby
    let tableID = `${subSection.dataKey}_table`;

    const headers = Object.keys(table.headers);
    let columns = [
      {
        id: "flagged",
        Header: <span aria-label="flag"></span>,
        accessor: (entry) =>
          this.getEntryFlagText(section, subSection.dataKey, entry),
        Cell: (props) => {
          let arrDisplay = props.value ? props.value.split("|") : null;
          let displayText = arrDisplay && arrDisplay[0] ? arrDisplay[0] : "";
          let displayClass = arrDisplay && arrDisplay[1] ? arrDisplay[1] : "";
          if (!arrDisplay) return null;
          return (
            <FontAwesomeIcon
              className={`flag flag-entry ${
                displayText ? "flagged " + displayClass : ""
              }`}
              icon="exclamation-circle"
              title={displayText ? displayText : "flag"}
              tabIndex={0}
            />
          );
        },
        sortable: false,
        width: 35,
        minWidth: 35,
      },
    ];

    headers.forEach((header) => {
      const headerKey = table.headers[header];
      const headerClass = headerKey.className ? headerKey.className : "";
      const column = {
        id: header,
        Header: () => {
          if (headerKey.omitHeader) return "";
          if (headerKey.header)
            return <h3 className="col-header-title">{header}</h3>;
          return (
            <span className={`col-header col-${header} ${headerClass}`}>
              {header}
            </span>
          );
        },
        accessor: (entry) => {
          let value = entry[headerKey];
          if (headerKey.formatter) {
            const { result } = this.props;
            let formatterArguments = headerKey.formatterArguments || [];
            value = formatit[headerKey.formatter](
              result,
              entry[headerKey.key],
              ...formatterArguments
            );
          }
          return value
            ? value
            : headerKey.default
            ? headerKey.default
            : entry[headerKey.key];
        },
        sortable: headerKey.sortable !== false,
      };

      let columnFormatter = headerKey.formatter;
      if (column.sortable) {
        if (headerKey.sorter) {
          if (sortit[headerKey.sorter]) {
            column.sortMethod = sortit[headerKey.sorter];
          }
        } else if (columnFormatter) {
          const sortObj = {
            dateTimeFormat: sortit.dateTimeCompare,
            dateFormat: sortit.dateCompare,
            dateAgeFormat: sortit.dateCompare,
            datishFormat: sortit.datishCompare,
            datishAgeFormat: sortit.datishCompare,
            ageFormat: sortit.ageCompare,
            quantityFormat: sortit.quantityCompare,
          };
          if (sortObj[columnFormatter])
            column.sortMethod = sortObj[columnFormatter];
        }
      }

      if (headerKey.minWidth != null) {
        column.minWidth = headerKey.minWidth;
      }

      if (headerKey.maxWidth != null) {
        column.maxWidth = headerKey.maxWidth;
      }

      columns.push(column);
    });

    let customProps = { id: tableID };
    let defaultSorted = [];
    if (table.defaultSorted) {
      defaultSorted.push(table.defaultSorted);
    }
    //getTheadThProps solution courtesy of:
    //https://spectrum.chat/react-table/general/is-there-a-way-to-activate-sort-via-onkeypress~66656e87-7f5c-4767-8b23-ddf35d73f8af
    return (
      <div
        key={index}
        className="table"
        role="table"
        aria-label={subSection.name}
        aria-describedby={customProps.id}
      >
        <ReactTable
          className={`sub-section__table ${
            columns.length <= 2 ? "single-column" : ""
          }`}
          columns={columns}
          data={filteredEntries}
          minRows={1}
          showPagination={filteredEntries.length > 10}
          pageSizeOptions={[10, 20, 50, 100]}
          defaultPageSize={10}
          defaultSorted={defaultSorted}
          resizable={false}
          getProps={() => customProps}
          getTheadThProps={(state, rowInfo, column, instance) => {
            return {
              tabIndex: 0,
              onKeyPress: (e, handleOriginal) => {
                if (e.which === 13) {
                  instance.sortColumn(column);
                  e.stopPropagation();
                }
              },
            };
          }}
        />
      </div>
    );
  }

  getWarningText(section) {
    const summaryMap = this.getSummaryMap();
    if (!summaryMap[section]) {
      return "";
    }
    if (summaryMap[section].usedemoflag && summaryMap[section]["demoData"]) {
      return summaryMap[section]["demoData"].advisoryText;
    }
    //possibly add other configurable warning text if need be
    return "";
  }

  renderGraph(panel) {
    if (panel.graphType === "MED") {
      let data = this.props.summary[panel.dataSectionRefKey];
      const mmeErrors = this.props.mmeErrors;
      return <MMEGraph data={data} error={mmeErrors}></MMEGraph>;
    }
    //can return other type of graph depending on the section
    return <div className="graph-placeholder"></div>;
  }

  renderRxSummaryPanel(panel) {
    let panelSet = this.props.summary[panel.statsData.dataSectionRefKey];
    let rxPanel = panelSet ? panelSet[panel.statsData.objectKey] : null;
    let rxData = panelSet && rxPanel ? rxPanel : [];
    let heading = rxData.fields
      ? rxData.fields.map((item, index) => {
          return <th key={`stats_head_${index}`}>{item.display_name}</th>;
        })
      : "";
    let bodyContent = rxData.data
      ? rxData.data.map((item, index) => {
          return (
            <tr key={`stats_row_${index}`}>
              {rxData.fields.map((fd, findex) => {
                return (
                  <td key={`stat_cell_${findex}`} className={`${fd.key}_cell`}>
                    {!item[fd.key] && fd.empty_cell_display
                      ? fd.empty_cell_display
                      : item[fd.key]}
                  </td>
                );
              })}
            </tr>
          );
        })
      : "";
    return (
      <div className="sub-section__infopanel">
        <div className="panel-title">{panel.title}</div>
        <div className="stats-container">
          <div className="content">
            {rxData.fields && rxData.fields.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>{heading}</tr>
                </thead>
                <tbody>{bodyContent}</tbody>
              </table>
            ) : (
              <div>No prescription summary to display</div>
            )}
          </div>
        </div>
        <ReactTooltip className="summary-tooltip" id="overviewTooltip" />
      </div>
    );
  }

  renderAlertsPanel(panel) {
    let alertsData =
      this.props.summary[panel.alertsData.dataSectionRefKey] || [];
    let alertsContent = alertsData.length
      ? alertsData.map((item, index) => {
          return (
            <div
              key={`alert_${index}`}
              className="alert-item"
              ref={this.elementRef}
              data-ref={`${item.id}_title`}
            >
              <a href={`#${item.id}_anchor`}>
                <FontAwesomeIcon
                  className={`flag ${item.className}`}
                  icon="exclamation-circle"
                  data-tip={`Go to ${item.name} section`}
                  data-for="overviewTooltip"
                  data-ref={`${item.id}_title`}
                  role="tooltip"
                  data-iscapture="true"
                />
                <span className="text">{item.text}</span>
              </a>
            </div>
          );
        })
      : "No alert entries found";
    return (
      <div className="sub-section__infopanel">
        <div className="panel-title">{panel.title}</div>
        <div className="alerts-container">
          <div className="title">{panel.alertsData.title}</div>
          <div className="content">{alertsContent}</div>
        </div>
        <ReactTooltip className="summary-tooltip" id="overviewTooltip" />
      </div>
    );
  }

  renderSurveySummaryPanel(panel) {
    const config_tab = getEnv("REACT_APP_TABS");
    if (!config_tab || !String(config_tab).includes("report")) return null;
    let surveyData = this.props.summary[panel.data.dataSectionRefKey] || null;
    if (!surveyData) return null;
    return (
      <div className="sub-section__infopanel">
        <div className="stats-container">
          <div className="content">
            {
              <ScoringSummary
                summary={surveyData}
                title={panel.title}
                readOnly={true}
              ></ScoringSummary>
            }
          </div>
        </div>
      </div>
    );
  }

  renderPanel(section, panels, type) {
    let content = panels
      .filter((panel) => panel.type === type)
      .map((panel, index) => {
        return (
          <div key={`panel_${index}`} className={`panel ${panel.type}`}>
            {panel.type === "graph" && this.renderGraph(panel)}
            {panel.type === "surveysummary" &&
              this.renderSurveySummaryPanel(panel)}
            {panel.type === "rxsummary" && this.renderRxSummaryPanel(panel)}
            {panel.type === "alerts" && this.renderAlertsPanel(panel)}
          </div>
        );
      });
    return (
      <div className={`${section}-sub-section__panel sub-section__panel`}>
        {content}
      </div>
    );
  }

  renderSection(section) {
    const summaryMap = this.getSummaryMap();
    const sectionMap = summaryMap[section]["sections"];
    const queryDateTime = summaryMap[section].lastUpdated
      ? summaryMap[section].lastUpdated
      : formatit.currentDateTimeFormat();
    const subSectionsToRender = sectionMap.filter((section) => {
      return !section.hideSection;
    });
    const sectionError = summaryMap[section].errorMessage;
    const errorMessage = getErrorMessageString(
      sectionError,
      `Error ocurred retrieving data for ${section}`
    );
    const subSections = subSectionsToRender.map((subSection, index) => {
      const dataKeySource = this.props.summary[subSection.dataKeySource];
      const data = dataKeySource ? dataKeySource[subSection.dataKey] : null;
      const entries = (Array.isArray(data) ? data : []).filter(
        (r) => r != null
      );
      const panels = subSection.panels;
      const hasEntries = entries.length !== 0;
      const flagged = this.isSubsectionFlagged(section, subSection.dataKey);
      const flaggedClass = flagged ? "flagged" : "";
      const omitTitleClass = subSection.omitTitle ? "sub-section-notitle" : "";
      return (
        <div
          key={`${subSection.dataKey}_${index}`}
          className={`sub-section h3-wrapper  ${omitTitleClass}`}
        >
          {!subSection.omitTitle && (
            <h3
              id={`${subSection.dataKey}_title`}
              className={`sub-section__header`}
            >
              {flaggedClass && (
                <FontAwesomeIcon
                  className={`flag flag-nav ${flaggedClass}`}
                  icon={"circle"}
                  title="flag"
                  tabIndex={0}
                />
              )}
              <span className="sub-section__header__name">
                {subSection.name}
              </span>
              <span className="sub-section__header__info">
                {subSection.info && (
                  <div
                    onClick={(event) => this.handleOpenModal(subSection, event)}
                    onKeyDown={(event) =>
                      this.handleOpenModal(subSection, event)
                    }
                    role="button"
                    tabIndex={0}
                    aria-label={subSection.name}
                  >
                    <span
                      className="info-icon"
                      icon="info-circle"
                      title={`more info: ${subSection.name}`}
                      role="tooltip"
                    >
                      more info
                    </span>
                  </div>
                )}
              </span>
            </h3>
          )}
          {panels && (
            <div className="panels">
              {this.renderPanel(section, panels, "graph")}
              {
                <div className="sub-panels">
                  {this.renderPanel(section, panels, "rxsummary")}
                  {this.renderPanel(section, panels, "alerts")}
                  {this.renderPanel(section, panels, "surveysummary")}
                </div>
              }
            </div>
          )}

          {!hasEntries && !panels && this.renderNoEntries(section, subSection)}
          {hasEntries &&
            subSection.tables.map((table, index) =>
              this.renderTable(table, entries, section, subSection, index)
            )}
          {hasEntries &&
            this.isSubsectionFlagged(section, subSection.dataKey) &&
            this.renderGuideLine(subSection)}
        </div>
      );
    });
    return (
      <div>
        {subSections}
        {!summaryMap[section].skipDataInfo && (
          <DataInfo
            errorMessage={errorMessage}
            contentText={summaryMap[section].provenanceText}
            queryDateTime={queryDateTime}
            warningText={this.getWarningText(section)}
          />
        )}
      </div>
    );
  }

  renderSectionHeader(section) {
    const summaryMap = this.getSummaryMap();
    const flagged = this.isSectionFlagged(section);
    const flagClass = this.getSectionFlagClass(section);
    const flaggedClass = flagged ? `flagged ${flagClass ? flagClass : ""}` : "";
    const flagCount = this.getSectionFlagCount(section);
    const flaggedText = flagged
      ? `${
          flagCount
            ? flagCount +
              " flag entr" +
              (flagCount > 1 ? "ies" : "y") +
              " found"
            : ""
        }`
      : "";

    let icon = "";
    let sourceTitle = summaryMap[section]["title"];
    let title = sourceTitle;
    let entryCount = "";
    let iconProps = {
      width: 35,
      height: 35,
      className: "sectionIcon",
      title: sourceTitle,
    };
    let summary = this.props.summary;
    if (
      summary[section] &&
      !summaryMap[section]["omitCountDisplay"] &&
      summaryMap[section]["sections"]
    ) {
      let count = this.getSectionEntryCounts(section);
      if (count > 0) {
        entryCount = ` (${count})`;
      }
    }

    if (section === "PatientRiskOverview") {
      icon = <ChartIcon {...iconProps} />;
    } else if (
      section === "PertinentMedicalHistory" ||
      section === "CSAgreement"
    ) {
      icon = <MedicalHistoryIcon {...iconProps} />;
    } else if (section === "HistoricalTreatments") {
      icon = <MedicineIcon {...iconProps} />;
    } else if (section === "RiskConsiderations") {
      icon = <RiskIcon {...iconProps} />;
    } else if (section === "PDMPMedications") {
      icon = <RxIcon {...iconProps} />;
    } else if (section === "NonPharmacologicTreatments") {
      icon = <TreatmentsIcon {...iconProps} />;
    } else if (section === "PatientEducationMaterials") {
      icon = <UserIcon {...iconProps} />;
    } else if (section === "ProviderEducationMaterials") {
      icon = <ProviderIcon {...iconProps} />;
    } else if (section === "UrineDrugScreens") {
      icon = <FlaskIcon {...iconProps} />;
    }

    return (
      <h2 id={section} className="section__header">
        <div className="section__header-title">
          <span title={title}>{icon}</span>
          <span className="title-text-container">
            <span className="title-text">{title}</span>
            <span className="info">
              <span className="info-count-text">
                {entryCount && entryCount}
              </span>
              <FontAwesomeIcon
                className={`flag flag-header ${flaggedClass}`}
                icon="exclamation-circle"
                title={flaggedText}
                role="tooltip"
                data-tip={flaggedText}
                data-place="right"
                data-type="error"
                data-for="summaryTooltip"
              />
            </span>
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

  isUnderAge() {
    if (!this.props.patient) return false;
    return parseInt(this.props.patient.Age) < 18;
  }

  render() {
    const summaryMap = this.getSummaryMap();
    console.log("summary map ", summaryMap);
    const { summary, collector } = this.props;
    const meetsInclusionCriteria = summary.Patient
      ? !!summary.Patient.MeetsInclusionCriteria
      : false;
    const {
      EducationMaterials,
      PatientRiskOverview_graph,
      PatientRiskOverview_alerts,
      PatientRiskOverview_stats,
      ...CQLSummary
    } = summary;
    if (!summary) {
      return null;
    }
    const hasErrors =
      this.props.errorCollection && this.props.errorCollection.length > 0;

    const sectionsToRender = [];
    /*
     * sections to be rendered
     */
    Object.keys(summaryMap).forEach((section) => {
      if (summaryMap[section]["hideSection"]) return true;
      sectionsToRender.push(section);
    });

    return (
      <React.Fragment>
        <div className="summary">
          <SideNav
            id="summarySideNavButton"
            navClassName={`${meetsInclusionCriteria ? "close" : "hide"}`}
          ></SideNav>
          <div className="summary__display" id="maincontent">
            <h1 className="summary__display-title">
              Clinical Opioid Summary with Rx Integration
            </h1>
            {hasErrors && <ErrorBanner errors={this.props.errorCollection} />}
            {meetsInclusionCriteria && <ExclusionBanner />}
            {!hasErrors && !meetsInclusionCriteria && (
              <InclusionBanner dismissible={meetsInclusionCriteria} />
            )}
            {meetsInclusionCriteria && this.isUnderAge() && (
              <Warning text="This patient is under 18 years of age. Guidance for clinical decision support in COSRI is for patients 18 years and older. Please refer to pediatric clinical guidance when prescribing opioids for people under 18 years of age."></Warning>
            )}
            {meetsInclusionCriteria && (
              <div className="sections">
                {sectionsToRender.map((section, index) => {
                  return (
                    <Collapsible
                      trigger={this.renderSectionHeader(section)}
                      open={true}
                      key={index}
                    >
                      {this.renderSection(section)}
                    </Collapsible>
                  );
                })}
              </div>
            )}
            <Disclaimer />
            <DevTools
              collector={collector}
              summary={CQLSummary}
              //results not coming from CQL
              other={{
                EducationMaterials,
                PatientRiskOverview_graph,
                PatientRiskOverview_alerts,
                PatientRiskOverview_stats,
              }}
            />
            {/* display released version string */}
            <Version />
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
        </div>
      </React.Fragment>
    );
  }
}

Summary.propTypes = {
  summary: PropTypes.object.isRequired,
  summaryMap: PropTypes.object,
  patient: PropTypes.object,
  sectionFlags: PropTypes.object.isRequired,
  collector: PropTypes.array.isRequired,
  errorCollection: PropTypes.array,
  mmeErrors: PropTypes.bool,
  result: PropTypes.object.isRequired,
};
