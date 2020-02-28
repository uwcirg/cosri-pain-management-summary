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
import DataProvenance from './DataProvenance';
import InfoModal from './InfoModal';
import DevTools from './DevTools';

export default class Summary extends Component {
  constructor () {
    super(...arguments);

    this.state = {
      showModal: false,
      modalSubSection: null
    };

    this.subsectionTableProps = { id: 'react_sub-section__table'};

    ReactModal.setAppElement('body');
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
    const flagged = this.isSubsectionFlagged(section, subSection.dataKey);
    const flaggedClass = flagged ? 'flagged' : '';
    const sectionElement = this.props.sectionFlags[section];
    const flagText = sectionElement ? sectionElement[subSection.dataKey] : '';
    const tooltip = flagged ? flagText : '';
    return (
      <div className="table">
        <div className="no-entries">
          <div>
            <FontAwesomeIcon
              className={`flag flag-no-entry ${flaggedClass}`}
              icon="exclamation-circle"
      //       data-tip={flagText}
              title={`flag: ${tooltip}`}
              role="tooltip"
              tabIndex={0}
            />
            no entries found</div>
          <div className="flag-text">{flagText}</div>
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
        Header: () => <span className="col-header">{header}</span>,
        accessor: (entry) => {
          let value = entry[headerKey];
          if (headerKey.formatter) {
            console.log("formatter? ", headerKey.formatter)
            const { result } = this.props;
            let formatterArguments = headerKey.formatterArguments || [];
            value = formatit[headerKey.formatter](result, entry[headerKey.key], ...formatterArguments);
          }
          return value ? value: entry[headerKey.key];
        },
        sortable: headerKey.sortable !== false
      };

      if (column.sortable && headerKey.formatter) {
        switch(headerKey.formatter) {
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
          case 'linkFormat':
            column.sortMethod = sortit.linkCompare;
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
    //getTheadThProps solution courtesy of:
    //https://spectrum.chat/react-table/general/is-there-a-way-to-activate-sort-via-onkeypress~66656e87-7f5c-4767-8b23-ddf35d73f8af
    return (
      <div key={index} className="table" role="table"
           aria-label={subSection.name} aria-describedby={customProps.id}>
          <ReactTable
            className="sub-section__table"
            columns={columns}
            data={filteredEntries}
            minRows={1}
            showPagination={filteredEntries.length > 10}
            pageSizeOptions={[10, 20, 50, 100]}
            defaultPageSize={10}
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

  renderSection(section) {
    const sectionMap = summaryMap[section]["sections"];

    return sectionMap.map((subSection) => {
      const dataKeySource = this.props.summary[subSection.dataKeySource];
      const data = dataKeySource ? dataKeySource[subSection.dataKey] : null;
      const entries = (Array.isArray(data) ? data : [data]).filter(r => r != null);
      const hasEntries = entries.length !== 0;

      const flagged = this.isSubsectionFlagged(section, subSection.dataKey);
      const flaggedClass = flagged ? 'flagged' : '';
      const omitTitleClass = subSection.omitTitle ? 'sub-section-notitle' : '';

      return (
        <div key={subSection.dataKey} className="sub-section h3-wrapper">
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
                    <a
                    href={() => {return false;}}
                    className='info-icon'
                    icon="info-circle"
                    title={`more info: ${subSection.name}`}
                    data-tip="more info"
                    role="tooltip"
                    tabIndex={0}
                    >more info</a>

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

          {!hasEntries && this.renderNoEntries(section, subSection)}
          {hasEntries && subSection.tables.map((table, index) =>
            this.renderTable(table, entries, section, subSection, index))
          }
          {summaryMap[section].provenanceText &&
            <DataProvenance
              contentText={summaryMap[section].provenanceText}
              queryDateTime={formatit.currentDateTimeFormat()}
            />
          }
         </div>
      );
    });
  }

  renderSectionHeader(section) {
    const flagged = this.isSectionFlagged(section);
    const flaggedClass = flagged ? 'flagged' : '';
    const { numMedicalHistoryEntries, numPainEntries, numTreatmentsEntries, numRiskEntries, numNonPharTreatmentEntries, numPDMPDataEntries } = this.props;

    let icon = '';
    let sourceTitle = summaryMap[section]['title'];
    let title = sourceTitle;
    console.log(section)
    if (section === 'PertinentMedicalHistory') {
      icon = <MedicalHistoryIcon width="30" height="40" />;
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
      icon = <RxIcon className={`sectionIcon`} title={`${sourceTitle}`}/>;
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

    return (
      <div className="summary">
        <div className="summary__nav-wrapper"><nav className="summary__nav"></nav></div>

        <div className="summary__display" id="maincontent">
          <div className="summary__display-title">
            Clinical Opioid Summary with Rx Integration
          </div>

          {meetsInclusionCriteria && <ExclusionBanner />}

          {!meetsInclusionCriteria && <InclusionBanner dismissible={meetsInclusionCriteria} />}

          {meetsInclusionCriteria &&
            <div className="sections">
  
              <Collapsible trigger={this.renderSectionHeader("HistoricalTreatments")} open={true}>
                {this.renderSection("HistoricalTreatments")}
              </Collapsible>

              <Collapsible trigger={this.renderSectionHeader("PDMPMedications")} open={true}>
              {this.renderSection("PDMPMedications")}
              </Collapsible>

              <Collapsible trigger={this.renderSectionHeader("NonPharmacologicTreatments")} open={true}>
              {this.renderSection("NonPharmacologicTreatments")}
              </Collapsible>


              <Collapsible trigger={this.renderSectionHeader("PertinentMedicalHistory")} open={true}>
                {this.renderSection("PertinentMedicalHistory")}
              </Collapsible>

              <Collapsible trigger={this.renderSectionHeader("RiskConsiderations")} open={true}>
                {this.renderSection("RiskConsiderations")}
              </Collapsible>

              <Collapsible trigger={this.renderSectionHeader("Occupation")} open={true}>
              {this.renderSection("Occupation")}
              </Collapsible>

              <Collapsible trigger={this.renderSectionHeader("PatientEducationMaterials")} open={true}>
              {this.renderSection("PatientEducationMaterials")}
              </Collapsible>

              {/*
                <Collapsible tabIndex={0} trigger={this.renderSectionHeader("PainAssessments")} open={true}>
                  {this.renderSection("PainAssessments")}
                </Collapsible>
              */}
            </div>
          }

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
            This application was built using CDS Connect from AHRQ.  Funding was provided by.....
			Lorem ipsum dolor sit amet, consectetur adipibore et dolore magna aliqua.
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
