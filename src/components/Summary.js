import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Collapsible from 'react-collapsible';
import ReactTooltip from 'react-tooltip';
import ReactTable from 'react-table';
import ReactModal from 'react-modal';

import summaryMap from './summary.json';
import * as formatit from '../helpers/formatit';
import * as sortit from '../helpers/sortit';

import MedicalHistoryIcon from '../icons/MedicalHistoryIcon';
import PainIcon from '../icons/PainIcon';
import TreatmentsIcon from '../icons/TreatmentsIcon';
import RiskIcon from '../icons/RiskIcon';
import RxIcon from '../icons/RxIcon';
import MedicineIcon from '../icons/MedicineIcon';
import OccupationIcon from '../icons/OccupationIcon';
import UserIcon from '../icons/UserIcon';

import InclusionBanner from './InclusionBanner';
import ExclusionBanner from './ExclusionBanner';
import DataInfo from './DataInfo';
import DevTools from './DevTools';
import InfoModal from './InfoModal';
import MMEGraph from './graph/MMEGraph';

export default class Summary extends Component {
  constructor () {
    super(...arguments);

    this.state = {
      showModal: false,
      showNav: true,
      modalSubSection: null
    };

     // This binding is necessary to make `this` work in the callback
     this.handleNavToggle= this.handleNavToggle.bind(this);

    this.subsectionTableProps = { id: 'react_sub-section__table'};

    ReactModal.setAppElement('body');
  }

  handleNavToggle(e) {
    e.preventDefault();
    this.setState(state => ({
      showNav: !state.showNav
    }));
  }

  handleOpenModal = (modalSubSection,event) => {
    //only open modal   on 'enter' or click
    if(event.keyCode === 13 || event.type === "click") {
        this.setState({showModal: true, modalSubSection});
    }
  }

  handleCloseModal = () => {
    this.setState({ showModal: false });
  }

  isSectionFlagged(section) {
    const { sectionFlags } = this.props;
    const subSections = sectionFlags[section] ? Object.keys(sectionFlags[section]): null;

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

  // if flagged, returns flag text, else returns false
  isEntryFlagged(section, subSection, entry) {
    const { sectionFlags } = this.props;

    let flagged = false;
    sectionFlags[section][subSection].forEach((flag) => {
      if (flag.entryId === entry._id) {
        flagged = flag.flagText;
      }
    });

    return flagged;
  }

  renderNoEntries(section, subSection) {
    let guidelineElement = subSection["guideline"] ? subSection["guideline"]: null;
    let guidelineContent = "";
    if (guidelineElement) {
      guidelineContent = guidelineElement.map( (item, index) => {
        return <div key={`guideline_${index}`} className={`flag-no-entry ${item.type}`}>
          <FontAwesomeIcon
              className="flag"
              icon="exclamation-circle"
              title="guideline"
              role="tooltip"
              tabIndex={0}
          /> <span className="text">{item.text}</span>
        </div>
      });
    }
    const { sectionFlags } = this.props;
    let subSectionFlags = sectionFlags[section][subSection.dataKey];
    let flagEntries = [];
    let flagContent = "";
    if (subSectionFlags) {
      flagEntries = subSectionFlags.map((flag) => {
        return flag.flagText;
      });
    }
    if (flagEntries.length) {
      flagContent = flagEntries.map( (item, index) => {
        return <div key={`flag_${index}`}>
          <FontAwesomeIcon
              className="flag"
              icon="exclamation-circle"
              title="flag"
              role="tooltip"
              tabIndex={0}
          /> <span className="text">{item}</span>
        </div>
      });
    }
    return (
      <div id={`${subSection.dataKey}_table`} className={`table`}>
        <div className="no-entries">
          <div>no entries found</div>
            <div className="flag-guideline-content">
              <div>{flagContent}</div>
              <div className="guideline-content">
                {guidelineContent}
              </div>
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
      const negated = table.filter[0] === '!';
      const filter = negated ? table.filter.substring(1) : table.filter;
      filteredEntries = entries.filter(e => negated ? e[filter] == null : e[filter] != null);
    }
    if (filteredEntries.length === 0) return null;

    const headers = Object.keys(table.headers);
    let columns = [
      {
        id: 'flagged',
        Header: <span aria-label="flag"></span>,
        accessor: (entry) => this.isEntryFlagged(section, subSection.dataKey, entry),
        Cell: (props) =>
          <FontAwesomeIcon
            className={`flag flag-entry ${props.value ? 'flagged' : ''}`}
            icon="exclamation-circle"
            title={props.value ? `flag: ${props.value}` : 'flag'}
            data-tip={props.value ? props.value : ''}
            role="tooltip"
            tabIndex={0}
          />,
        sortable: false,
        width: 35,
        minWidth: 35
      }
    ];

    headers.forEach((header) => {
      const headerKey = table.headers[header];

      const column = {
        id: header,
        Header: () => <span className={`col-header col-${header}`}>{header}</span>,
        accessor: (entry) => {
          let value = entry[headerKey];
          if (headerKey.formatter) {
            const { result } = this.props;
            let formatterArguments = headerKey.formatterArguments || [];
            value = formatit[headerKey.formatter](result, entry[headerKey.key], ...formatterArguments);
          }
          return value ? value: entry[headerKey.key];
        },
        sortable: headerKey.sortable !== false
      };

      let columnFormatter = headerKey.sorter?headerKey.sorter: headerKey.formatter;
      if (column.sortable && columnFormatter) {
        switch(columnFormatter) {
          case 'dateTimeFormat':
            column.sortMethod = sortit.dateTimeCompare;
            break;
          case 'dateFormat': case 'dateAgeFormat':
            column.sortMethod = sortit.dateCompare;
            break;
          case 'datishFormat': case 'datishAgeFormat':
            column.sortMethod = sortit.datishCompare;
            break;
          case 'ageFormat':
            column.sortMethod = sortit.ageCompare;
            break;
          case 'quantityFormat':
            column.sortMethod = sortit.quantityCompare;
            break;
          default:
            // do nothing, rely on built-in sort
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

    //ReactTable needs an ID for aria-describedby
    let tableID = subSection.name.replace(/ /g,"_") + "-table";
    let customProps = {id:tableID};
    let defaultSorted = [];
    if (table.defaultSorted) {
      defaultSorted.push(table.defaultSorted);
    }
    //getTheadThProps solution courtesy of:
    //https://spectrum.chat/react-table/general/is-there-a-way-to-activate-sort-via-onkeypress~66656e87-7f5c-4767-8b23-ddf35d73f8af
    return (
      <div key={index} id={`${subSection.dataKey}_table`} className="table" role="table"
           aria-label={subSection.name} aria-describedby={customProps.id}>
          <ReactTable
            className={`sub-section__table ${columns.length <= 2? 'single-column': ''}`}
            columns={columns}
            data={filteredEntries}
            minRows={1}
            showPagination={filteredEntries.length > 10}
            pageSizeOptions={[10, 20, 50, 100]}
            defaultPageSize={10}
            defaultSorted={defaultSorted}
            resizable={false}
            getProps={() => customProps}
            getTheadThProps={(state,rowInfo,column,instance) => {
                return {
                    tabIndex: 0,
                    onKeyPress: (e, handleOriginal) => {
                        if(e.which === 13) {
                            instance.sortColumn(column);
                            e.stopPropagation();
                        }
                    }
                };
            }}
          />
      </div>
    );
  }

  getWarningText(section) {
    if (!summaryMap[section]) {
      return "";
    }
    if (summaryMap[section].usedemoflag && summaryMap[section]["demoData"]) {
      return summaryMap[section]["demoData"].advisoryText;
    }
    //possibly add other configurable warning text if need be
    return "";
  }

  renderGraph(data, type) {
    if (type === "MED") {
      return <MMEGraph data={data}></MMEGraph>;
    }
    //can return other type of graph depending on the section
    return <div className="graph-placeholder"></div>;
  }

  renderOverviewPanel(panel) {
    let statsContent = (this.props.summary[panel.statsData.dataSectionRefKey]).map((item, index) => {
      let objResult = Object.entries(item);
      return(
        <div key={`stats_${index}`}>{`${objResult[0][0]} :`}<span className="divider">{objResult[0][1]}</span></div>
      )
    });
    let alertsContent = (this.props.summary[panel.alertsData.dataSectionRefKey]).map((item, index) => {
      return <div key={`alert_${index}`} className="alert-item">
        <a href={`#${item.id}_table`}><FontAwesomeIcon
          className="flag"
          icon="exclamation-circle"
          data-tip={`go to ${item.name}`}
          role="tooltip"
        /></a>{item.text}</div>;
    });
    return (<div className="sub-section__infopanel">
        <div className="panel-title">{panel.title}</div>
        <div className="stats-container">
          <div className="title">{panel.statsData.title}</div>
          <div className="content">{statsContent || "No entries"}</div>
        </div>
        <div className="alerts-container">
          <div className="title">{panel.alertsData.title}</div>
          <div className="content">{alertsContent || "No alert entries found."}</div>
        </div>
      </div>)
  }

  renderPanel(section, panels) {
    let content = panels.map((panel, index) => {
      return (<div key={`panel_${index}`} className="panel">
          {panel.type === "graph" && this.renderGraph(panel.data, panel.graphType)}
          {panel.type === "overview" && this.renderOverviewPanel(panel)}
        </div>);
    });
    return (<div className={`${section}-sub-section__panel sub-section__panel`}>{content}</div>);
  }

  renderSection(section) {
    const sectionMap = summaryMap[section]["sections"];
    const queryDateTime = summaryMap[section].lastUpdated ? summaryMap[section].lastUpdated : formatit.currentDateTimeFormat();
    const subSections = sectionMap.map((subSection, index) => {
      const dataKeySource = this.props.summary[subSection.dataKeySource];
      const data = dataKeySource ? dataKeySource[subSection.dataKey] : null;
      const entries = (Array.isArray(data) ? data : [data]).filter(r => r != null);
     // const graphData = dataKeySource ? this.props.summary[subSection.dataKey+"_graphdata"] : null;
    //  const graphType = subSection.graph? subSection.graph.type: "";
      const panels = subSection.panels;
      const hasEntries = entries.length !== 0;
      const flagged = this.isSubsectionFlagged(section, subSection.dataKey);
      const flaggedClass = flagged ? 'flagged' : '';
      const omitTitleClass = subSection.omitTitle ? 'sub-section-notitle' : '';
      return (
        <div key={`${subSection.dataKey}_${index}`} className={`sub-section h3-wrapper`}>
          <h3 id={subSection.dataKey} className={`sub-section__header ${omitTitleClass}`}>
            <FontAwesomeIcon
              className={`flag flag-nav ${flaggedClass}`}
              icon={'circle'}
              title="flag"
              tabIndex={0}
            />
            <span className="sub-section__header__name">{subSection.name}</span>
            <span className="sub-section__header__info">{subSection.info &&
                  <div
                    onClick={(event) => this.handleOpenModal(subSection,event)}
                    onKeyDown={(event) => this.handleOpenModal(subSection,event)}
                    role="button"
                    tabIndex={0}
                    aria-label={subSection.name}>
                    <span
                    className='info-icon'
                    icon="info-circle"
                    title={`more info: ${subSection.name}`}
                    data-tip="more info"
                    role="tooltip"
                    tabIndex={0}
                    >more info</span>

                    {/* {<FontAwesomeIcon
                      className='info-icon'
                      icon="info-circle"
                      title={`more info: ${subSection.name}`}
                      data-tip="more info"
                      role="tooltip"
                      tabIndex={0}
                    />} */}
                  </div>
              }</span>

          </h3>

          {panels && this.renderPanel(section, panels)}

          {!hasEntries && !panels && this.renderNoEntries(section, subSection)}
          {/* {this.renderGraph(section, graphData, graphType)} */}
          {hasEntries && subSection.tables.map((table, index) =>
            this.renderTable(table, entries, section, subSection, index))
          }
         </div>
      );
    });
    return (<div>
      {subSections}
      {!summaryMap[section].skipDataInfo && <DataInfo
            errorMessage={summaryMap[section].errorMessage}
            contentText={summaryMap[section].provenanceText}
            queryDateTime={queryDateTime}
            warningText={this.getWarningText(section)}
          />}
    </div>);
  }

  renderSectionHeader(section) {
    const flagged = this.isSectionFlagged(section);
    const flaggedClass = flagged ? 'flagged' : '';
    const { numMedicalHistoryEntries, numPainEntries, numTreatmentsEntries, numRiskEntries, numNonPharTreatmentEntries, numPDMPDataEntries } = this.props;

    let icon = '';
    let sourceTitle = summaryMap[section]['title'];
    let title = sourceTitle;
    if (section === 'PertinentMedicalHistory') {
      icon = <MedicalHistoryIcon width="25" height="35" />;
      title += ` (${numMedicalHistoryEntries})`;
    } else if (section === 'PainAssessments') {
      icon = <PainIcon width="35"  height="35" />;
      title += ` (${numPainEntries})`
    } else if (section === 'HistoricalTreatments') {
      icon = <MedicineIcon className={`sectionIcon`} title={`${sourceTitle}`} />;
      title += ` (${numTreatmentsEntries})`
    } else if (section === 'RiskConsiderations') {
      icon = <RiskIcon width="35" height="34" />;
      title += ` (${numRiskEntries})`;
    } else if (section === 'PDMPMedications') {
      icon = <RxIcon width="20" height="25" className={`sectionIcon`} title={`${sourceTitle}`}/>;
      title += ` (${numPDMPDataEntries})`;
    } else if (section === 'NonPharmacologicTreatments') {
      icon =  <TreatmentsIcon width="36" height="38" />;
      title += ` (${numNonPharTreatmentEntries})`;
    } else if (section === 'Occupation') {
      icon = <OccupationIcon className={`sectionIcon`} title={`${sourceTitle}`}/>;
    } else if (section === 'PatientEducationMaterials') {
      icon = <UserIcon className={`sectionIcon`} title={`${sourceTitle}`} />;
    }

    return (
      <h2 id={section} className="section__header">
        <div className="section__header-title">
          {icon}

          <span>
            {title}
            <FontAwesomeIcon className={`flag flag-header ${flaggedClass}`} icon="exclamation-circle" title="flag" />
          </span>
        </div>

        <FontAwesomeIcon className="chevron" icon="chevron-right" title="expand/collapse" />
      </h2>
    );
  };

  render() {
    const { summary, collector, result } = this.props;
    const meetsInclusionCriteria = summary.Patient.MeetsInclusionCriteria;
    if (!summary) { return null; }

    const sectionsToRender = [];
    /*
     * sections to be rendered
     */
    Object.keys(summaryMap).forEach(section => {
      sectionsToRender.push(section);
    });

    return (
      <div className="summary">
        <div className={`${this.state.showNav?'open': ''} summary__nav-wrapper`}><nav className="summary__nav"></nav><div className={`${meetsInclusionCriteria?'close':'hide'}`} title="toggle menu sidebar" onClick={this.handleNavToggle}></div></div>

        <div className="summary__display" id="maincontent">
          <div className="summary__display-title">
            Clinical Opioid Summary with Rx Integration
          </div>

          {meetsInclusionCriteria && <ExclusionBanner />}

          {!meetsInclusionCriteria && <InclusionBanner dismissible={meetsInclusionCriteria} />}

          {meetsInclusionCriteria &&
            <div className="sections">

              {sectionsToRender.map((section, index) => {
                return <Collapsible trigger={this.renderSectionHeader(section)} open={true} key={index}>
                  {this.renderSection(section)}
                </Collapsible>
              })}

              {/*
                <Collapsible tabIndex={0} trigger={this.renderSectionHeader("PainAssessments")} open={true}>
                  {this.renderSection("PainAssessments")}
                </Collapsible>
              */}
            </div>
          }

          <div className="legend">
            <div>
              <span className="icon orange"></span>CDC guidelines in accordance with Washington State guideline
            </div>
            <div>
              <span className="icon red"></span>Washington State guideline exclusively
            </div>
          </div>

          <div className="cdc-disclaimer">
            Please see the
            <a
              href="https://www.cdc.gov/mmwr/volumes/65/rr/rr6501e1.htm"
              alt="CDC Guideline for Prescribing Opioids for Chronic Pain"
              target="_blank"
              rel="noopener noreferrer">
              CDC Guideline for Prescribing Opioids for Chronic Pain
            </a>
            for additional information and prescribing guidance.
          </div>

	       <div  className="cdc-disclaimer">
         COSRI incorporates the Clinical Pain Management Summary application, released as open-source software by CDS Connect project at the Agency for Healthcare Research and Quality (AHRQ). We have extended ARHQ's work to provide enhanced security, improved decision support, integration with state Prescription Drug Monitoring Program databases, standalone operation, and other features. For a description of our open source release, contact <a href="mailto:info@cosri.app">info@cosri.app</a>. Support for the development of COSRI was provided by the Washington State Department of Health and the Washington State Health Care Authority through the CMS Support Act.
          </div>


          <DevTools
            collector={collector}
            result={result}
            summary={summary}
          />

          <ReactTooltip className="summary-tooltip" />

          <ReactModal
            className="modal"
            overlayClassName="overlay"
            isOpen={this.state.showModal}
            onRequestClose={this.handleCloseModal}
            contentLabel="More Info">
            <InfoModal
              closeModal={this.handleCloseModal}
              subSection={this.state.modalSubSection} />
          </ReactModal>
        </div>
      </div>
    );
  }
}

Summary.propTypes = {
  summary: PropTypes.object.isRequired,
  sectionFlags: PropTypes.object.isRequired,
  collector: PropTypes.array.isRequired,
  result: PropTypes.object.isRequired,
  numMedicalHistoryEntries: PropTypes.number.isRequired,
  numPainEntries: PropTypes.number.isRequired,
  numTreatmentsEntries: PropTypes.number.isRequired,
  numRiskEntries: PropTypes.number.isRequired,
  numNonPharTreatmentEntries: PropTypes.number.isRequired,
  numPDMPDataEntries: PropTypes.number.isRequired
};
