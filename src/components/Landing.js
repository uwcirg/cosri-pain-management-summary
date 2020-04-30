import React, { Component } from 'react';
import tocbot from 'tocbot';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import executeElm from '../utils/executeELM';
import sumit from '../helpers/sumit';
import flagit from '../helpers/flagit';
import {datishFormat} from '../helpers/formatit';
import summaryMap from './summary.json';

import Header from './Header';
import Summary from './Summary';
import Spinner from '../elements/Spinner';

import patientEducationReferences from './patientEducationReferences.json';


let uuid = 0;

function generateUuid() {
  return ++uuid; // eslint-disable-line no-plusplus
}

export default class Landing extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      result: null,
      loading: true,
      collector: [],
      externals: {}
    };

    this.tocInitialized = false;
  }

  componentDidMount() {
    Promise.all([executeElm(this.state.collector), this.getExternalData()])
    .then(
      response => {
        //set result from data from EPIC
        let result = response[0];
        //add data from other sources, e.g. PDMP
        result['Summary'] = {...result['Summary'], ...response[1]};
        result['Summary']['PatientEducationMaterials'] = patientEducationReferences;
        const { sectionFlags, flaggedCount } = this.processSummary(result.Summary);
        console.log("summary ", result['Summary']);
        this.setState({ loading: false});
        this.setState({ result, sectionFlags, flaggedCount });
      }
    )
    .catch((err) => {
      console.error(err);
      this.setState({ loading: false});
    });
  }

  componentDidUpdate() {
    if (!this.tocInitialized && !this.state.loading && this.state.result) {
      tocbot.init({
        tocSelector: '.summary__nav',           // where to render the table of contents
        contentSelector: '.summary__display',   // where to grab the headings to build the table of contents
        headingSelector: 'h2, h3',              // which headings to grab inside of the contentSelector element
        positionFixedSelector: '.summary__nav', // element to add the positionFixedClass to
        collapseDepth: 0,                       // how many heading levels should not be collpased
        includeHtml: true                       // include the HTML markup from the heading node, not just the text
      });

      this.tocInitialized = true;
    }

    if (this.state.result && this.state.result.Summary.Patient.Name) {
      const patientName = this.state.result.Summary.Patient.Name;
      document.title = `Pain Management Summary - ${patientName}`;
    }
  }
  /*
   * function for retrieving data from other sources e.g. PDMP
   */
  async getExternalData() {
    let dataSet = {};
    const promiseResultSet = [];

    /*
     * retrieve entries from Summary map, i.e. summary.json that requires fetching data via external API
     */
    for (let key in summaryMap) {
      if (summaryMap[key].dataSource) {
        promiseResultSet.push(summaryMap[key].dataSource);
      }
    }

    if (!promiseResultSet.length) {
      return dataSet;
    }

    let results = await Promise.all(promiseResultSet.map(item => {
      let endpoint = (item.endpoint)
                    .replace('{env.REACT_APP_CONF_API_URL}', process.env.REACT_APP_CONF_API_URL)
                    .replace('{env.PUBLIC_URL}', process.env.PUBLIC_URL);
      return this.fetchData(`${endpoint}`, item.dataKey, item.dataKeySource)
    })).catch(e => {
      console.log(`Error parsing external data response json: ${e.message}`);
      promiseResultSet.forEach(item => {
        dataSet[item.dataKey] = null;
      });
      return dataSet;
    });

    promiseResultSet.forEach((item, index) => {
      let result = results[index];
      //require additional processing of result data
      if (item.processFunction && this[item.processFunction]) {
        result = this[item.processFunction](results[index][item.dataKey]);
      }
      dataSet[item.dataKey] = result ? result: null;

    });
    return dataSet;
  }

  processOccupationData (result) {
    if (!result || !result.length) return null;

    /*
     * filter results for occupation items
     */
    result = result.filter(item => {
      return item['resource']['code']['coding'][0]['code'] === summaryMap['Occupation']['occupationObsCode'];
    });

    if (!result.length) return null;

    let morphedResult = {'Current': {}, 'Previous': {}};
    result = result.map(item => item.resource);

    result.forEach((item, index) => {
      if (index > 1) return true;
      let key = index === 0 ? 'Current': 'Previous';
      if (item.valueCodeableConcept && item['valueCodeableConcept']['text']) {
        morphedResult[key]['jobTitle'] = item['valueCodeableConcept']['text'];
      }
      if (!item.component) {
        morphedResult[key]['description'] = [];
        return true;
      }
      let occupaSectionKeys = summaryMap['Occupation']['itemObsCodeKeys'];
      let description = [];
      /*
       * select items to display - from json that matched the observation code
       * display selected items from returned response
       */
      occupaSectionKeys.forEach(key => {
        let matched = (item.component).find(subitem => {
          if (subitem.code && subitem.code['coding'][0]['code'] === key) {
            return subitem;
          }
          return false;
        });
        if (matched) {
          let value = '';
          if (matched.valueString) {
            value = matched.valueString;
          } else if (matched.valueQuantity) {
            value = matched.valueQuantity['value'];
          } else if (matched.valueCodeableConcept) {
            value = matched.valueCodeableConcept['text'];
          }
          description.push({
            'text': matched.code['text'],
            'value': value
          });
        }
      });
      morphedResult[key]['description'] = description;
    });
    return morphedResult;
  }

  getDemoData(datasetKey) {
    if (!datasetKey || !summaryMap[datasetKey]) return null;
    if (summaryMap[datasetKey]["demoData"]) {
      return summaryMap[datasetKey]["demoData"];
    }
  }

  setDemoDataFlag(datasetKey) {
    if (summaryMap[datasetKey]) {
      summaryMap[datasetKey].usedemoflag = true;
    }
  }

  setDataError(datasetKey, message) {
    if (!summaryMap[datasetKey] || !message) {
      return;
    }
    summaryMap[datasetKey]["errorMessage"] = message;
  }

  async fetchData (url, datasetKey, rootElement) {
    let dataSet = {};
    dataSet[datasetKey] = {};
    const MAX_WAIT_TIME = 15000;
    // Create a promise that rejects in maximum wait time in milliseconds
    let timeoutPromise = new Promise((resolve, reject) => {
      let id = setTimeout(() => {
        clearTimeout(id);
        reject(`Timed out in ${MAX_WAIT_TIME} ms.`)
      }, MAX_WAIT_TIME);
    });

    // let response = await fetch(url)
    // .catch(e => console.log(`Error fetching ${datasetKey} data: ${e.message}`));

    /*
     * if for some reason fetching the request data doesn't resolve or reject withing the maximum waittime,
     * then the timeout promise will kick in
     */
    let results = await Promise.race([
      fetch(url),
      timeoutPromise
    ]).catch(e => {
      console.log(`Error fetching data from ${datasetKey}: ${e}`);
      this.setDataError(datasetKey, `There was error fetching data: ${e}`);
    });

    let json = null;
    if (results) {
      try {
        //read response stream
        json = await (results.json()).catch(e => {
          console.log(`Error parsing ${datasetKey} response json: ${e.message}`);
          this.setDataError(datasetKey, `There was error parsing data: ${e.message}`);
        });
      } catch(e) {
        this.setDataError(datasetKey, `There was error parsing data: ${e}`);
        json = null;
      }
    }

    if (!json) {
      let demoData = this.getDemoData(datasetKey);
      //if unable to fetch data, set data to demo data if any
      if (demoData) {
        dataSet[datasetKey] = demoData[rootElement];
        this.setDemoDataFlag(datasetKey);
        return dataSet;
      }
      dataSet[datasetKey] = null;
      return dataSet;
    }
    let responseDataSet = null;
    try {
      responseDataSet  = json && json[rootElement]? json[rootElement]: null;
    } catch(e) {
      this.setDataError(datasetKey, `Data does not contained the required root element ${rootElement}`);
      responseDataSet  = null;
    } finally {
      dataSet[datasetKey] = responseDataSet;
      return dataSet;
    }
  }

  getAnalyticsData(endpoint, apikey, summary) {
    const meetsInclusionCriteria = summary.Patient.MeetsInclusionCriteria;
    const applicationAnalytics = {
      meetsInclusionCriteria
    };

    if (meetsInclusionCriteria) {
      let totalCount = 0;
      applicationAnalytics.sections = [];

      const cloneSections = JSON.parse(JSON.stringify(summary));
      delete cloneSections.Patient;

      // Build total number of entries for each subsection of the summary.
      Object.keys(cloneSections).forEach((sectionKey, i) => {
        applicationAnalytics.sections.push({ section: sectionKey, subSections: [] });
        Object.keys(cloneSections[sectionKey]).forEach(subSectionKey => {
          let SectionElement = cloneSections[sectionKey];
          if (!SectionElement) return true;
          const subSection = SectionElement[subSectionKey];
          if (!subSectionKey) return true;
          let count;
          if (subSection instanceof Array) count = subSection.length;
          else if (subSection instanceof Object) count = 1;
          else count = 0;
          totalCount += count;
          applicationAnalytics.sections[i].subSections.push({
            subSection: subSectionKey, numEntries: count
          });
        });
      });

      applicationAnalytics.totalNumEntries = totalCount;
    }

    let jsonBody = JSON.stringify(applicationAnalytics);

    const requestOptions = {
      body: jsonBody,
      headers: {
        'x-api-key': `${apikey}`,
        'Content-Type': 'application/json',
        'Content-Length': jsonBody.length
      },
      method: 'POST'
    };

    fetch(`${endpoint}`, requestOptions)
      .catch(err => { console.log(err) });
  }

  processSummary(summary) {
    /*
     * TODO: certain sections we have chosen not to display so need to exclude those when tallying up flag counts
     * suppressed section: "PertinentMedicalHistory", "PainAssessments", "RiskConsiderations"
     */
    const sectionFlags = {};
    const sectionKeys = Object.keys(summaryMap);
    let flaggedCount = 0;

    sectionKeys.forEach((sectionKey, i) => { // for each section
      sectionFlags[sectionKey] = {};
      summaryMap[sectionKey]["sections"].forEach((subSection) => { // for each sub section
        const keySource = summary[subSection.dataKeySource];
        if (!keySource) {
          return true;
        }
        const data = keySource[subSection.dataKey];
        const entries = (Array.isArray(data) ? data : [data]).filter(r => r != null);

        if (entries.length > 0) {
          if (subSection.graph) {
            let graphFields = subSection.graph["fields"] || [];
            let graphData = [];
            entries.forEach(item => {
              let matchedKeys = Object.keys(item).filter(key => {
                return graphFields.indexOf(key) !== -1;
              });
              if (matchedKeys.length === graphFields.length) {
                let o = {};
                matchedKeys.forEach(key => {
                  o[key] = item[key];
                });
                graphData.push(o);
              }
            });
            /*
             *  TODO: Remove or modify after demo, based on demo data, not accurate
             *
             */
            if (graphData.length) {
              graphData.sort(function(a, b) {
                return parseInt(b["_id"]) - parseInt(a["_id"]);
              });
              summary[subSection.dataKeySource+"_graphdata"] = graphData;
              if (subSection.graph.summarySection) {
                let summarySectionRef = subSection.graph.summarySection;
                if (summary[summarySectionRef.dataKey]) {
                  if (!summary[summarySectionRef.dataKey][summarySectionRef.dataKeySource]) {
                    let resultObj = {};
                    for (let key in summarySectionRef["keyMatches"]) {
                      let value = graphData[graphData.length-1][key];
                      resultObj[summarySectionRef["keyMatches"][key]] = value ? value: summarySectionRef["display"];
                    }
                    summary[summarySectionRef.dataKey][summarySectionRef.dataKeySource] = [resultObj];
                  }
                }
              }
            }
          }
          sectionFlags[sectionKey][subSection.dataKey] = entries.reduce((flaggedEntries, entry) => {
            if (entry._id == null) {
              entry._id = generateUuid();
            }
            const entryFlag = flagit(entry, subSection, summary);

            if (entryFlag) {
              flaggedEntries.push({ 'entryId': entry._id, 'flagText': entryFlag});
              flaggedCount += 1;
            }

            return flaggedEntries;
          }, []);
        } else {
          const sectionFlagged = flagit(null, subSection, summary);
          sectionFlags[sectionKey][subSection.dataKey] = sectionFlagged;

          if (sectionFlagged) {
            flaggedCount += 1;
          }
        }
      });
    });

    // Get the configured endpoint to use for POST for app analytics
    fetch(`${process.env.PUBLIC_URL}/config.json`)
      .then(response => response.json())
      .then(config => {
        // Only provide analytics if the endpoint has been set
        if (config.analytics_endpoint) {
          this.getAnalyticsData(config.analytics_endpoint, config.x_api_key, summary);
        }
      })
      .catch(err => { console.log(err) });

    return { sectionFlags, flaggedCount };
  }

  render() {
    if (this.state.loading) {
      return <Spinner />;
    }

    if (this.state.result == null) {
      return (
        <div className="banner error">
          <FontAwesomeIcon icon="exclamation-circle" title="error" /> Error: See console for details.
        </div>
      );
    }
    const patientResource = this.state.collector[0]['data'];
    const summary = this.state.result.Summary;
    const { sectionFlags, flaggedCount } = this.state;
    const numMedicalHistoryEntries = sumit(summary.PertinentMedicalHistory || {});
    const numPainEntries = sumit(summary.PainAssessments || {});
    const numNonPharTreatmentEntries =  sumit(summary.HistoricalTreatments['NonPharmacologicTreatments'] || {});
    const numTreatmentsEntries = sumit(summary.HistoricalTreatments || {}) - numNonPharTreatmentEntries;
    const numRiskEntries =
      sumit(summary.RiskConsiderations || {}) +
      sumit(summary.MiscellaneousItems || {}); // TODO: update when CQL updates
    //const numExternalDataEntries = sumit(summary.ExternalDataSet || {});
    const numPDMPDataEntries = sumit(summary.PDMPMedications || {});
    //const totalEntries = numMedicalHistoryEntries + numPainEntries + numTreatmentsEntries + numRiskEntries;
    const totalEntries = numTreatmentsEntries + numNonPharTreatmentEntries + numPDMPDataEntries;
    const patientOccupation = summary.Occupation && summary.Occupation.Current? summary.Occupation.Current['jobTitle'] : '';
    return (
      <div className="landing">
        <div id="skiptocontent"><a href="#maincontent">skip to main content</a></div>

        <Header
          patientName={summary.Patient.Name}
          patientDOB={datishFormat(this.state.result,patientResource.birthDate)}
          patientGender={summary.Patient.Gender}
          patientOccupation={patientOccupation}
          totalEntries={totalEntries}
          numFlaggedEntries={flaggedCount}
          meetsInclusionCriteria={summary.Patient.MeetsInclusionCriteria}
        />

        <Summary
          summary={summary}
          sectionFlags={sectionFlags}
          collector={this.state.collector}
          result={this.state.result}
          numMedicalHistoryEntries={numMedicalHistoryEntries}
          numPainEntries={numPainEntries}
          numTreatmentsEntries={numTreatmentsEntries}
          numRiskEntries={numRiskEntries}
          numNonPharTreatmentEntries={numNonPharTreatmentEntries}
          numPDMPDataEntries={numPDMPDataEntries}
        />
      </div>
    );
  }
}
