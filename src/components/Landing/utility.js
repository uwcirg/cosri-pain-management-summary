import {
  datishFormat,
  dateFormat,
  dateNumberFormat,
} from "../../helpers/formatit";
import flagit from "../../helpers/flagit";
import { dateCompare } from "../../helpers/sortit";
import {
  getDiffDays,
  getEnvSystemType,
  getEnvConfidentialAPIURL,
  isEmptyArray,
  saveData,
  writeToLog,
} from "../../helpers/utility";
import { getEnv, ENV_VAR_PREFIX } from "../../utils/envConfig";

let uuid = 0;

export function generateUuid() {
  return ++uuid; // eslint-disable-line no-plusplus
}

export function processEndPoint(endpoint, endpointParams) {
  if (!endpoint) return "";
  const params = endpointParams ? endpointParams : {};
  return endpoint
    .replace(
      `{process.env.${ENV_VAR_PREFIX}_CONF_API_URL}`,
      getEnvConfidentialAPIURL()
    )
    .replace("{process.env.PUBLIC_URL}", getEnv("PUBLIC_URL"))
    .replace("{patientId}", params.patientId);
}

export async function fetchExternalData(url, datasetKey, rootElement) {
  let dataSet = {};
  dataSet[datasetKey] = {};
  const MAX_WAIT_TIME = 15000;
  // Create a promise that rejects in maximum wait time in milliseconds
  let timeoutPromise = new Promise((resolve, reject) => {
    let id = setTimeout(() => {
      clearTimeout(id);
      reject(`Timed out in ${MAX_WAIT_TIME} ms.`);
    }, MAX_WAIT_TIME);
  });
  /*
   * if for some reason fetching the request data doesn't resolve or reject withing the maximum waittime,
   * then the timeout promise will kick in
   */
  let results = await Promise.race([fetch(url), timeoutPromise]).catch((e) => {
    return Promise.reject(
      new Error(`There was error fetching data for ${datasetKey}: ${e}`)
    );
  });

  let json = null;
  let responseDataSet = null;
  if (results && results.ok) {
    try {
      //read response stream
      json = await results.json().catch((e) => {
        throw new Error(e);
      });
    } catch (e) {
      return Promise.reject(
        new Error(`There was error parsing data for ${datasetKey}: ${e}`)
      );
    }
    try {
      responseDataSet = json[rootElement];
    } catch (e) {
      return Promise.reject(
        `Data does not contained the required root element ${rootElement} for ${datasetKey}: ${e}`
      );
    }
  }
  dataSet[datasetKey] = responseDataSet;
  return dataSet;
}

/*
 * function for retrieving data from other sources e.g. education materials
 */
export async function getExternalData(summaryMap) {
  const promiseResultSet = getExternalDataSources(summaryMap);
  if (!promiseResultSet.length) {
    return null;
  }
  let dataSet = {};
  let results = await Promise.allSettled(
    promiseResultSet.map((item) => {
      return fetchExternalData(
        processEndPoint(item.endpoint),
        item.dataKey,
        item.dataKey
      );
    })
  ).catch((e) => {
    console.log(`Error parsing external data response json: ${e.message}`);
    return null;
  });
  let errors = {};
  promiseResultSet.forEach((item, index) => {
    let result = results[index];
    if (result.status === "rejected") {
      errors[item.dataKey] = result.reason;
    }
    //require additional processing of result data
    if (
      !errors[item.dataKey] &&
      item.processFunction &&
      this[item.processFunction]
    ) {
      try {
        result = this[item.processFunction](
          result.value ? result.value[item.dataKey] : null,
          item.dataKey
        );
      } catch (e) {
        console.log(
          `Error processing data result via processing function ${item.processFunction}: ${e}`
        );
      }
    }
    if (!dataSet[item.dataKeySource]) {
      dataSet[item.dataKeySource] = {};
    }
    if (errors[item.dataKey]) {
      dataSet[item.dataKeySource][item.dataKey] = null;
    } else {
      dataSet[item.dataKeySource][item.dataKey] = result.value
        ? result.value[item.dataKey]
        : result[item.dataKey]
        ? result[item.dataKey]
        : result;
    }
  });
  return {
    data: dataSet,
    errors: errors,
  };
}

export function getDemoData(section, params) {
  if (!section || !section["demoData"]) return null;
  if (!section["demoData"]["endpoint"]) {
    return null;
  }
  return fetch(processEndPoint(section["demoData"]["endpoint"], params));
}

export function getProcessedSummaryData(summary, summaryMap) {
  let sectionFlags = {};
  const sectionKeys = Object.keys(summaryMap || {});
  let flaggedCount = 0;

  sectionKeys.forEach((sectionKey, i) => {
    // for each section
    sectionFlags[sectionKey] = {};
    //don't process flags for section that will be hidden
    if (summaryMap[sectionKey]["hideSection"]) {
      summary[sectionKey] = [];
      return true;
    }
    summaryMap[sectionKey]["sections"].forEach((subSection) => {
      // for each sub section
      if (!subSection) return true;
      //don't process flags for sub section that will be hidden
      if (subSection["hideSection"]) {
        summary[subSection.dataKeySource][subSection.dataKey] = [];
        return true;
      }
      const keySource = summary[subSection.dataKeySource];
      if (!keySource) {
        return true;
      }
      const data = keySource[subSection.dataKey];
      const entries = (Array.isArray(data) ? data : [data]).filter(
        (r) => r != null
      );
      const alertMapping = subSection.alertMapping || {};

      if (entries.length > 0) {
        sectionFlags[sectionKey][subSection.dataKey] = entries.reduce(
          (flaggedEntries, entry) => {
            if (entry._id == null) {
              entry._id = generateUuid();
            }
            const entryFlag = flagit(entry, subSection, summary);
            if (entryFlag) {
              flaggedCount += 1;
              let flagText =
                typeof entryFlag === "object" ? entryFlag["text"] : entryFlag;
              let flagClass =
                typeof entryFlag === "object" ? entryFlag["class"] : "";
              let flagDateField =
                typeof entryFlag === "object"
                  ? entryFlag["date"]
                  : alertMapping.dateField
                  ? alertMapping.dateField
                  : null;

              flaggedEntries.push({
                entryId: entry._id,
                entry: entry,
                subSection: subSection,
                flagText: flagText,
                flagClass: flagClass,
                flagCount: flaggedCount,
                flagDateText:
                  entry && entry[flagDateField]
                    ? dateFormat("", entry[flagDateField])
                    : "",
                priority:
                  flagClass === "info"
                    ? 1000
                    : alertMapping.priority
                    ? alertMapping.priority
                    : 0,
              });
            }

            return flaggedEntries;
          },
          []
        );
      } else {
        const sectionFlagged = flagit(null, subSection, summary);
        // console.log("subSection? ", subSection, " flagged? ", sectionFlagged)
        if (sectionFlagged) {
          flaggedCount += 1;
          sectionFlags[sectionKey][subSection.dataKey] = [
            {
              flagText:
                typeof sectionFlagged === "object"
                  ? sectionFlagged["text"]
                  : sectionFlagged,
              flagCount: flaggedCount,
              subSection: subSection,
              priority: alertMapping.priority ? alertMapping.priority : 0,
            },
          ];
        }
      }
    });
  });

  return { sectionFlags, flaggedCount };
}

export function getSummaryGraphDataSet(graphConfig, summaryData) {
  if (!summaryData) return null;
  if (!(graphConfig && graphConfig.summaryDataSource)) {
    return null;
  }
  //demo config set to on, then draw just the demo graph data
  if (getEnv(graphConfig.demoConfigKey)) {
    return graphConfig.demoData;
  }
  //get the data from summary data
  let sections = graphConfig.summaryDataSource;
  let graphDataSet = {};
  sections.forEach((item) => {
    if (
      summaryData[item.section_key] &&
      summaryData[item.section_key][item.subSection_key] &&
      !isEmptyArray(summaryData[item.section_key][item.subSection_key])
    ) {
      const sectionKey =
        item.key ?? `${item.section_key}_${item.subSection_key}`;
      graphDataSet[sectionKey] = {
        ...item,
        data: getProcessedGraphData(
          graphConfig,
          JSON.parse(
            JSON.stringify(summaryData[item.section_key][item.subSection_key])
          )
        ),
      };
    }
  });
  if (Object.keys(graphDataSet).length === 0) {
    const defaultConfig = graphConfig.defaultDataSource;
    graphDataSet[defaultConfig.key] = {
      ...defaultConfig,
      data: getProcessedGraphData(
        graphConfig,
        JSON.parse(
          JSON.stringify(
            summaryData[defaultConfig.section_key][defaultConfig.subSection_key]
          )
        )
      ),
    };
  }
  console.log("graphData Set ", graphDataSet);
  return graphDataSet;
}

export function getProcessedGraphData(graphConfig, graphDataSource) {
  const [
    startDateFieldName,
    endDateFieldName,
    MMEValueFieldName,
    graphDateFieldName,
  ] = [
    graphConfig.startDateField,
    graphConfig.endDateField,
    graphConfig.mmeField,
    graphConfig.graphDateField,
  ];
  const START_DELIMITER_FIELD_NAME = "start_delimiter";
  const END_DELIMITER_FIELD_NAME = "end_delimiter";
  const PLACEHOLDER_FIELD_NAME = "placeholder";
  const FINAL_CALCULATED_FIELD_FLAG = "final";

  //sort data by start date
  let graph_data = !isEmptyArray(graphDataSource)
    ? graphDataSource
        .filter(function (item) {
          return item[startDateFieldName] && item[endDateFieldName];
        })
        .sort(function (a, b) {
          return dateCompare(a[startDateFieldName], b[startDateFieldName]);
        })
    : [];
  /*
   * 'NaN' is the value for null when coerced into number, need to make sure that is not included
   */
  const getRealNumber = (o) => (o !== null && !isNaN(o) && o >= 0 ? o : 0);
  let dataPoints = [];
  let prevObj = null,
    nextObj = null;
  graph_data.forEach(function (currentMedicationItem, index) {
    let dataPoint = {};
    let startDate = dateFormat(
      "",
      currentMedicationItem[startDateFieldName]
    );
    let endDate = dateFormat(
      "",
      currentMedicationItem[endDateFieldName]
    );
    let oStartDate = new Date(startDate);
    let diffDays = getDiffDays(startDate, endDate);
    nextObj = index + 1 <= graph_data.length - 1 ? graph_data[index + 1] : null;
    let currentMMEValue = getRealNumber(
      currentMedicationItem[MMEValueFieldName]
    );
    //add start date data point
    dataPoint = {};
    dataPoint[graphDateFieldName] = currentMedicationItem[startDateFieldName];
    dataPoint[MMEValueFieldName] = currentMMEValue;
    dataPoint[START_DELIMITER_FIELD_NAME] = true;
    dataPoint = { ...dataPoint, ...currentMedicationItem };
    dataPoints.push(dataPoint);

    //add intermediate data points between start and end dates
    if (diffDays >= 2) {
      for (let index = 2; index <= diffDays; index++) {
        let dataDate = new Date(oStartDate.valueOf());
        dataDate.setTime(dataDate.getTime() + index * 24 * 60 * 60 * 1000);
        dataDate = dateFormat("", dataDate, "YYYY-MM-DD");
        dataPoint = {};
        dataPoint[graphDateFieldName] = dataDate;
        dataPoint[MMEValueFieldName] = currentMMEValue;
        dataPoint[PLACEHOLDER_FIELD_NAME] = true;
        dataPoint[startDateFieldName] = dataDate;
        dataPoint = { ...dataPoint, ...currentMedicationItem };
        dataPoints.push(dataPoint);
      }
    }

    //add end Date data point
    dataPoint = {};
    dataPoint[graphDateFieldName] = currentMedicationItem[endDateFieldName];
    dataPoint[MMEValueFieldName] = currentMMEValue;
    dataPoint[END_DELIMITER_FIELD_NAME] = true;
    dataPoint[PLACEHOLDER_FIELD_NAME] = true;
    dataPoint = { ...dataPoint, ...currentMedicationItem };
    dataPoints.push(dataPoint);
    prevObj = currentMedicationItem;
  });

  //sort data by date
  dataPoints = dataPoints.sort(function (a, b) {
    return dateCompare(a[graphDateFieldName], b[graphDateFieldName]);
  });

  //get all available dates
  let arrDates = dataPoints.map((item) => item.date);
  arrDates = arrDates.filter((d, index) => {
    return arrDates.indexOf(d) === index;
  });

  //loop through graph data to ADD MME values for the ones occurring on the same date
  let cumMMEValue = 0;
  arrDates.forEach((pointDate) => {
    cumMMEValue = 0;
    let matchedItems = dataPoints.filter((d) => {
      return d.date === pointDate;
    });
    if (matchedItems.length <= 1) return true;
    matchedItems.forEach((o) => {
      cumMMEValue += getRealNumber(o[MMEValueFieldName]);
    });
    dataPoints.forEach((dataPoint) => {
      if (dataPoint.date === pointDate) {
        dataPoint[MMEValueFieldName] = cumMMEValue;
      }
    });
  });
  prevObj = null;
  let finalDataPoints = [];
  dataPoints.forEach(function (currentDataPoint, index) {
    let dataPoint = {};
    nextObj = dataPoints[index + 1] ? dataPoints[index + 1] : null;

    if (!prevObj) {
      //add starting graph point
      dataPoint = {};
      dataPoint[graphDateFieldName] = currentDataPoint[graphDateFieldName];
      dataPoint[MMEValueFieldName] = 0;
      dataPoint[START_DELIMITER_FIELD_NAME] = true;
      dataPoint[PLACEHOLDER_FIELD_NAME] = true;
      finalDataPoints.push(dataPoint);
    }
    //overlapping data points
    if (
      prevObj &&
      prevObj[MMEValueFieldName] !== currentDataPoint[MMEValueFieldName]
    ) {
      //add data point with MME value for the previous med as the connecting data point
      dataPoint = {};
      dataPoint[graphDateFieldName] = currentDataPoint[graphDateFieldName];
      dataPoint[MMEValueFieldName] = getRealNumber(prevObj[MMEValueFieldName]);
      dataPoint[PLACEHOLDER_FIELD_NAME] = true;
      finalDataPoints.push(dataPoint);
      finalDataPoints.push(currentDataPoint);
    } else if (
      prevObj &&
      currentDataPoint[START_DELIMITER_FIELD_NAME] &&
      dateNumberFormat(currentDataPoint[startDateFieldName]) >
        dateNumberFormat(prevObj[endDateFieldName])
    ) {
      //a new data point as med starts after the previous med ends
      if (
        getDiffDays(
          prevObj[endDateFieldName],
          currentDataPoint[startDateFieldName]
        ) > 1
      ) {
        dataPoint = {};
        dataPoint[graphDateFieldName] = currentDataPoint[graphDateFieldName];
        //add 0 value dummy data point to denote start of med where applicable
        dataPoint[MMEValueFieldName] = 0;
        //dataPoint[START_DELIMITER_FIELD_NAME] = true;
        dataPoint[PLACEHOLDER_FIELD_NAME] = true;
        finalDataPoints.push(dataPoint);
      }
      //add current data point
      finalDataPoints.push(currentDataPoint);
    } else if (
      nextObj &&
      currentDataPoint[END_DELIMITER_FIELD_NAME] &&
      dateNumberFormat(currentDataPoint[endDateFieldName]) <
        dateNumberFormat(nextObj[startDateFieldName])
    ) {
      //add current data point
      finalDataPoints.push(currentDataPoint);
      if (
        getDiffDays(
          currentDataPoint[endDateFieldName],
          nextObj[startDateFieldName]
        ) > 1
      ) {
        dataPoint = {};
        dataPoint[graphDateFieldName] = currentDataPoint[graphDateFieldName];
        //add 0 value dummy data point to denote end of med where applicable
        dataPoint[MMEValueFieldName] = 0;
        dataPoint[END_DELIMITER_FIELD_NAME] = true;
        dataPoint[PLACEHOLDER_FIELD_NAME] = true;
        finalDataPoints.push(dataPoint);
      }
    } else {
      if (!nextObj) currentDataPoint[FINAL_CALCULATED_FIELD_FLAG] = true;
      finalDataPoints.push(currentDataPoint);
    }

    if (!nextObj) {
      //add ending graph point
      dataPoint = {};
      dataPoint[graphDateFieldName] = currentDataPoint[graphDateFieldName];
      dataPoint[MMEValueFieldName] = 0;
      dataPoint[END_DELIMITER_FIELD_NAME] = true;
      dataPoint[PLACEHOLDER_FIELD_NAME] = true;
      finalDataPoints.push(dataPoint);
    }
    prevObj = finalDataPoints[finalDataPoints.length - 1];
  });
  let formattedData = JSON.parse(JSON.stringify(finalDataPoints))
    .map((point) => {
      let o = {};
      o[graphDateFieldName] = point[graphDateFieldName];
      o[MMEValueFieldName] = Math.round(
        getRealNumber(point[MMEValueFieldName])
      );
      if (point[PLACEHOLDER_FIELD_NAME]) {
        o[PLACEHOLDER_FIELD_NAME] = point[PLACEHOLDER_FIELD_NAME];
      }
      if (point[FINAL_CALCULATED_FIELD_FLAG]) {
        o[FINAL_CALCULATED_FIELD_FLAG] = true;
      }
      return o;
    })
    .filter(
      (item, index, ref) =>
        ref.findIndex(
          (target) => JSON.stringify(target) === JSON.stringify(item)
        ) === index
    );

  return formattedData;
}
export function getProcessedAlerts(sectionFlags, logParams) {
  let alerts = [];
  if (!sectionFlags) {
    return alerts;
  }
  //compile relevant alerts
  for (let section in sectionFlags) {
    for (let subsection of Object.entries(sectionFlags[section])) {
      if (subsection[1]) {
        if (typeof subsection[1] === "string") {
          alerts.push(subsection[1]);
        }
        if (typeof subsection[1] === "object") {
          if (Array.isArray(subsection[1])) {
            subsection[1].forEach((subitem) => {
              //this prevents addition of duplicate alert text
              let alertTextExist = alerts.filter(
                (item) =>
                  String(item.flagText).toLowerCase() ===
                  String(subitem.flagText).toLowerCase()
              );
              if (!alertTextExist.length && subitem.flagText) {
                let flagDateText = subitem.flagDateText
                  ? subitem.flagDateText
                  : "";
                alerts.push({
                  id: subitem.subSection.dataKey,
                  name: subitem.subSection.name,
                  flagText: subitem.flagText,
                  className: subitem.flagClass,
                  text:
                    subitem.flagText.indexOf("[DATE]") >= 0
                      ? subitem.flagText.replace(
                          "[DATE]",
                          datishFormat("", flagDateText)
                        )
                      : subitem.flagText +
                        (subitem.flagDateText
                          ? ` (${datishFormat("", flagDateText)})`
                          : ""),
                  priority: subitem.priority || 100,
                });
                //log alert
                if (logParams)
                  writeToLog(
                    "alert flag: " + subitem.flagText,
                    "warn",
                    logParams
                  );
              }
            });
          } else if (subsection[1].flagText) {
            alerts.push({
              id: subsection[1].subSection.dataKey,
              name: subsection[1].subSection.name,
              text: subsection[1].flagText,
              className: subsection[1].flagClass,
              priority: subsection[1].priority || 100,
            });
          }
        }
      }
    }
  }
  alerts.sort(function (a, b) {
    return a.priority - b.priority;
  });
  return alerts.filter(
    (item, index, thisRef) =>
      thisRef.findIndex((t) => t.text === item.text) === index
  );
}

export function getProcessedStatsData(statsConfig, summaryData) {
  let stats = {};
  if (!statsConfig || isEmptyArray(statsConfig.data)) return stats;
  const statsFields = statsConfig.data;
  const dataSource = summaryData[statsConfig.dataKeySource]
    ? summaryData[statsConfig.dataKeySource][statsConfig.dataKey]
    : [];

  //compile tally of source identified by a key
  statsFields.forEach((item) => {
    let dataSet = [],
      statItem = {};
    let keyMatch = item.keyMatch,
      summaryFields = item.summaryFields,
      matchSet = item.matchSet;
    if (keyMatch && matchSet) {
      matchSet.forEach((subitem) => {
        let matchItem = {};
        matchItem[keyMatch] = subitem.display_name;
        matchItem.data = [];
        /* get matching data for each key */
        subitem.keys.forEach((key) => {
          let matchedData = dataSource.filter((d) => {
            if (Array.isArray(d[keyMatch])) {
              return d[keyMatch].indexOf(key) !== -1;
            }
            return d[keyMatch] === key;
          });
          matchItem.data = [...matchItem.data, ...matchedData];
        });
        summaryFields.forEach((summaryField) => {
          if (summaryField.key === "total") {
            matchItem[summaryField.key] = matchItem.data.length;
            return true;
          }
          if (summaryField.identifier) return true;
          let matchedDataByKey = matchItem.data.filter(
            (dItem) => dItem[summaryField.key]
          );
          //de-duplicate
          matchItem[summaryField.key] = Array.from(
            new Set(matchedDataByKey.map((dItem) => dItem[summaryField.key]))
          ).length;
        });
        dataSet.push(matchItem);
      });
      statItem = {
        fields: summaryFields,
        data: dataSet,
      };
      stats[item.title] = statItem;
    } //end if keyMatch & matchSet
    else if (keyMatch) {
      let filteredStatsSource = dataSource.filter(
        (element) => element[item.keyMatch]
      );
      filteredStatsSource = Array.from(
        new Set(filteredStatsSource.map((subitem) => subitem[item.keyMatch]))
      );
      statItem[item.title] = filteredStatsSource.length;
      stats.push(statItem);
    }
  });
  return stats;
}

export function getMMEErrors(summary) {
  let errors = [];
  if (!summary) return errors;
  //PDMP medications
  let pdmpMeds = summary["PDMPMedications"];
  if (!pdmpMeds || !pdmpMeds["PDMPMedications"]) {
    return errors;
  }

  let o = pdmpMeds["PDMPMedications"];
  let errorItems = [];
  o.forEach((item) => {
    //do not report medication that has been reported
    if (
      errorItems.filter((errorItem) => errorItem["name"] === item["name"])
        .length > 0
    )
      return true;
    let isOpioid =
      item["Class"] &&
      item["Class"].filter((medClass) => {
        return String(medClass).toLowerCase() === "opioid";
      }).length > 0;
    //IF not an opioid med don't raise error
    //look for medication that contains NDC code but not RxNorm Code, or contains all necessary information (NDC Code, RxNorm Code and Drug Class) but no MME
    if (
      isOpioid &&
      item["NDC_Code"] &&
      (!item["RXNorm_Code"] || !item["MME"])
    ) {
      errorItems.push(item);
      errors.push(
        `Medication, ${item["Name"]}, did not have an MME value returned, total MME and the MME overview graph are not reflective of total MME for this patient.`
      );
    }
  });
  return errors;
}

export function logMMEEntries(summary, logParams) {
  if (!summary) return;
  //PDMP medications
  let pdmpMeds = summary["PDMPMedications"];
  if (!pdmpMeds || !pdmpMeds["PDMPMedications"]) {
    return;
  }

  let o = pdmpMeds["PDMPMedications"];
  let errorItems = [];
  o.forEach((item) => {
    //do not report medication that has been reported
    if (
      errorItems.filter((errorItem) => errorItem["name"] === item["name"])
        .length > 0
    )
      return true;
    let isOpioid =
      item["Class"] &&
      item["Class"].filter((medClass) => {
        return String(medClass).toLowerCase() === "opioid";
      }).length > 0;
    //IF not an opioid med don't raise error
    //look for medication that contains NDC code but not RxNorm Code, or contains all necessary information (NDC Code, RxNorm Code and Drug Class) but no MME
    if (
      isOpioid &&
      item["NDC_Code"] &&
      (!item["RXNorm_Code"] || !item["MME"])
    ) {
      errorItems.push(item);
      //log failed MME calculation
      writeToLog(
        `MME calculation failure: Name: ${item.Name} NDC: ${item.NDC_Code} Quantity: ${item.Quantity} Duration: ${item.Duration} Factor: ${item.factor}`,
        "error",
        logParams
      );
    }
    if (item.MME) {
      //log MME calculated if present
      writeToLog(
        `MME calculated: Name: ${item.Name} NDC: ${item.NDC_Code} RxNorm: ${item.RXNorm_Code} MME: ${item.MME}`,
        "info",
        logParams
      );
    }
  });
}

export function savePDMPSummaryData(summary, fileName) {
  if (!summary) return;
  const PDMP_DATAKEY = "PDMPMedications";
  //pdmp data
  const pdmpData = summary[PDMP_DATAKEY]
    ? summary[PDMP_DATAKEY][PDMP_DATAKEY]
    : null;
  if (!pdmpData) return;
  const pdmpContext = "CQL PMP MME Result";
  saveData({
    context: pdmpContext,
    data: pdmpData,
    filename: fileName,
    timestamp: new Date(),
  });
  //can save other data if needed
}

export function getExternalDataSources(summaryMap) {
  const promiseResultSet = [];
  if (!summaryMap) return promiseResultSet;
  const systemType = String(getEnvSystemType()).toLowerCase();

  /*
   * retrieve entries from Summary map, i.e. summary.json that requires fetching data via external API
   */
  for (let key in summaryMap) {
    if (summaryMap[key].dataSource) {
      summaryMap[key].dataSource.forEach((item) => {
        if (item.endpoint && typeof item.endpoint === "object") {
          if (item.endpoint[systemType])
            item.endpoint = item.endpoint[systemType];
          else item.endpoint = item.endpoint["default"];
        }
        promiseResultSet.push(item);
      });
    }
  }
  return promiseResultSet;
}

export function getAnalyticsData(endpoint, apikey, summary) {
  const meetsInclusionCriteria = summary.Patient
    ? summary.Patient.MeetsInclusionCriteria
    : false;
  const applicationAnalytics = {
    meetsInclusionCriteria,
  };

  if (meetsInclusionCriteria) {
    let totalCount = 0;
    applicationAnalytics.sections = [];

    const cloneSections = JSON.parse(JSON.stringify(summary));
    delete cloneSections.Patient;

    // Build total number of entries for each subsection of the summary.
    Object.keys(cloneSections).forEach((sectionKey, i) => {
      applicationAnalytics.sections.push({
        section: sectionKey,
        subSections: [],
      });
      Object.keys(cloneSections[sectionKey]).forEach((subSectionKey) => {
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
          subSection: subSectionKey,
          numEntries: count,
        });
      });
    });

    applicationAnalytics.totalNumEntries = totalCount;
  }

  let jsonBody = JSON.stringify(applicationAnalytics);

  const requestOptions = {
    body: jsonBody,
    headers: {
      "x-api-key": `${apikey}`,
      "Content-Type": "application/json",
      "Content-Length": jsonBody.length,
    },
    method: "POST",
  };

  fetch(`${endpoint}`, requestOptions).catch((err) => {
    console.log(err);
  });
}

export function getProcessProgressDisplay(resourcesTypes) {
  if (!resourcesTypes) return null;
  let totalResources = 0;
  let numResourcesLoaded = 0;
  let loadedResources = "";
  const camel2title = (camelCase) =>
    camelCase
      .replace(/([A-Z])/g, (match) => ` ${match}`)
      .replace(/^./, (match) => match.toUpperCase())
      .trim();
  for (let key in resourcesTypes) {
    let title = camel2title(key);
    if (resourcesTypes[key]) {
      //data loaded text
      loadedResources += `<div class='text-success resource-item'>&#10003; ${title} data loaded</div>`;
      numResourcesLoaded = numResourcesLoaded + 1;
    } else {
      //data loading in progress
      loadedResources += `<div class='text-warning text-bold resource-item'>Loading ${title} data...</div>`;
    }
    totalResources = totalResources + 1;
  }
  let stillLoading = numResourcesLoaded < totalResources;
  let textClass = stillLoading ? "text-warning" : "text-success";
  return `<div><div class='title-text'>${
    totalResources === 0
      ? "Gathering resources..."
      : totalResources + " resources are to be loaded."
  }</div><div class='${
    totalResources === 0 ? "hide" : "title-text"
  }'><span class='${textClass}'>${
    stillLoading ? numResourcesLoaded : totalResources
  } loaded ...</span></div><div class='resources-container'>${loadedResources}</div></div>`;
}
export function getSummaryMapWithUpdatedSectionsVis(summaryMap) {
  if (!summaryMap) return null;
  let newMap = Object.create(summaryMap);
  for (const key in newMap) {
    let sectionsToBeHidden = [];
    if (newMap[key]["sections"]) {
      //hide sub section if any
      newMap[key]["sections"].forEach((section) => {
        if (
          getEnv(
            `${ENV_VAR_PREFIX}_SUBSECTION_${section.dataKey.toUpperCase()}`
          ) === "hidden"
        ) {
          section["hideSection"] = true;
          sectionsToBeHidden.push(section);
        }
      });
      // only some of the subsections are hidden, so main section remains visible
      if (
        sectionsToBeHidden.length > 0 &&
        sectionsToBeHidden.length < newMap[key]["sections"].length
      )
        continue;
    }
    //hide main section if any
    if (getEnv(`${ENV_VAR_PREFIX}_SECTION_${key.toUpperCase()}`) === "hidden") {
      newMap[key]["hideSection"] = true;
    }
  }
  return newMap;
}

export function getUpdatedSummaryMapWithErrors(summaryMap, sectionErrors) {
  if (!sectionErrors) return summaryMap;
  let updatedMap = Object.create(summaryMap);
  for (let key in updatedMap) {
    updatedMap[key] = {
      ...updatedMap[key],
      errorMessage: sectionErrors[key],
    };
  }
  return {
    ...summaryMap,
    ...updatedMap,
  };
}

export function getSummaryErrors(summary) {
  if (!summary)
    return {
      errors: [],
      hasMmeErrors: false,
      mmeErrors: [],
    };
  //compile error(s) related to MME calculations
  let mmeErrors = getMMEErrors(summary);

  // the rest of the errors
  let errors = [];
  for (let section in summary) {
    if (summary[section] && summary[section].error) {
      errors.push(summary[section].error);
    }
  }
  return {
    errors: errors,
    hasMmeErrors: !!(mmeErrors && mmeErrors.length),
    mmeErrors: mmeErrors,
  };
}

export function getCollectorErrors(arrCollection) {
  if (isEmptyArray(arrCollection)) return [];
  let collectorErrors = arrCollection.filter((item) => {
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
    if (item.error) {
      const sourceType = item?.type ?? itemURL;
      const sourceTypeText = sourceType ? `[${sourceType}]` : "";
      errors.push(`${sourceTypeText} ${item.error}`);
    }
  });
  return errors;
}

export function getResponseErrors(responses) {
  if (isEmptyArray(responses)) return [];
  let errors = [];
  responses.forEach((response) => {
    if (response.status === "rejected" && response.reason) {
      errors.push(response.reason);
    }
  });
  return errors;
}
