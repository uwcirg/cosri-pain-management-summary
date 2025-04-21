import FHIR from "fhirclient";
import cql from "cql-execution";
import cqlfhir from "cql-exec-fhir";
import extractResourcesFromELM from "./extractResourcesFromELM";
import dstu2FactorsELM from "../cql/dstu2/Factors_to_Consider_in_Managing_Chronic_Pain.json";
import dstu2CommonsELM from "../cql/dstu2/CDS_Connect_Commons_for_FHIRv102.json";
import dstu2HelpersELM from "../cql/dstu2/FHIRHelpers.json";
import r4FactorsELM from "../cql/r4/Factors_to_Consider_in_Managing_Chronic_Pain_FHIRv401.json";
import r4CommonsELM from "../cql/r4/CDS_Connect_Commons_for_FHIRv401.json";
import r4HelpersELM from "../cql/r4/FHIRHelpers.json";
import r4MMECalculatorELM from "../cql/r4/MMECalculator.json";
import r4OMTKDataELM from "../cql/r4/OMTKData.json";
import r4OMTKLogicELM from "../cql/r4/OMTKLogic.json";
import r4SurveyCommonELM from "../cql/r4/survey_resources/Common_LogicLibrary.json";
import valueSetDB from "../cql/valueset-db.json";
import { fetchEnvData } from "./envConfig";
import {
  isEnvEpicQueries,
  getEnvVersionString,
  getReportInstrumentList,
  getReportInstrumentIdByKey,
  isEmptyArray,
  isReportEnabled,
} from "../helpers/utility";

const noCacheHeader = {
  "Cache-Control": "no-cache",
};
const FHIR_RELEASE_VERSION_2 = 2;
const FHIR_RELEASE_VERSION_4 = 4;
const PATIENT_SUMMARY_KEY = "Summary";

class VSACAwareCodeService extends cql.CodeService {
  // Override findValueSetsByOid to extract OID from VSAC URLS
  findValueSetsByOid(id) {
    const [oid] = this.extractOidAndVersion(id);
    return super.findValueSetsByOid(oid);
  }

  // Override findValueSet to extract OID from VSAC URLS
  findValueSet(id, version) {
    const [oid, embeddedVersion] = this.extractOidAndVersion(id);
    return super.findValueSet(oid, version != null ? version : embeddedVersion);
  }

  /**
   * Extracts the oid and version from a url, urn, or oid. Only url supports an embedded version
   * (separately by |); urn and oid will never return a version. If the input value is not a valid
   * urn or VSAC URL, it is assumed to be an oid and returned as-is.
   * Borrowed from: https://github.com/cqframework/cql-exec-vsac/blob/master/lib/extractOidAndVersion.js
   * @param {string} id - the urn, url, or oid
   * @returns {[string,string]} the oid and optional version as a pair
   */
  extractOidAndVersion(id) {
    if (id == null) return [];

    // first check for VSAC FHIR URL (ideally https is preferred but support http just in case)
    // if there is a | at the end, it indicates that a version string follows
    let m = id.match(
      /^https?:\/\/cts\.nlm\.nih\.gov\/fhir\/ValueSet\/([^|]+)(\|(.+))?$/
    );
    if (m) return m[3] == null ? [m[1]] : [m[1], m[3]];

    // then check for urn:oid
    m = id.match(/^urn:oid:(.+)$/);
    if (m) return [m[1]];

    // finally just return as-is
    return [id];
  }
}

async function executeELM(collector, paramResourceTypes) {
  fetchEnvData();
  let client, release, library, patientBundle;
  let resourceTypes = paramResourceTypes || {};
  const INSTRUMENT_LIST = isReportEnabled() ? getReportInstrumentList() : null;
  const SURVEY_FHIR_RESOURCES = ["QuestionnaireResponse", "Questionnaire"];
  console.log("instrument list to be loaded for report: ", INSTRUMENT_LIST);
  return new Promise((resolve) => {
    const returnResults = FHIR.oauth2
      .ready()
      .then((clientArg) => {
        client = clientArg;
        return client.getFhirRelease();
      })
      // then remember the release for later and get the release-specific library
      .then((releaseNum) => {
        release = releaseNum;
        library = getLibrary(release);
      })
      // then query the FHIR server for the patient, sending it to the next step
      .then(() => client.patient.read())
      // then gather all the patient's relevant resource instances and send them in a bundle to the next step
      .then((pt) => {
        collector.push({ data: pt, url: `Patient/${pt.id}` });
        const shouldLoadSurveyResources =
          FHIR_RELEASE_VERSION_4 && INSTRUMENT_LIST;
        const surveyResources = shouldLoadSurveyResources
          ? [...SURVEY_FHIR_RESOURCES, "Report"]
          : [];
        // Don't return until all the requests have been resolved
        return Promise.allSettled(
          [...extractResourcesFromELM(library), ...surveyResources].map(
            (name) => {
              resourceTypes[name] = false;
              if (name === "Report") return null;
              if (name === "Patient") {
                resourceTypes[name] = true;
                return [pt];
              }
              return doSearch(client, release, name, collector, resourceTypes);
            }
          )
        )
          .then((requestResults) => {
            const resources = [];
            requestResults.forEach((result) => {
              const { status, value } = result;
              if (status === "rejected") return true;
              if (!value || !value.length) return true;
              value.forEach((item) => {
                if (String(item.resourceType).toLowerCase() === "bundle") {
                  if (item.entry) {
                    item.entry.forEach((o) => {
                      if (o.resource) resources.push(o.resource);
                      else resources.push(o);
                    });
                  }
                } else resources.push(item);
              });
            });
            return {
              resourceType: "Bundle",
              entry: resources.map((r) => ({ resource: r })),
            };
          })
          .catch((e) => {
            console.log("Error occurred processing data ", e);
          });
      })
      // then execute the library and return the results (wrapped in a Promise)
      .then((bundle) => {
        const patientSource = getPatientSource(release);
        const codeService = new VSACAwareCodeService(valueSetDB);
        const executor = new cql.Executor(library, codeService);
        //debugging
        console.log("bundle loaded? ", bundle);
        patientSource.loadBundles([bundle]);
        patientBundle = bundle;
        let execResults;
        try {
          execResults = executor.exec(patientSource);
        } catch (e) {
          console.log("Error occurred executing CQL ", e);
          if (collector) {
            collector.forEach((item) => {
              if (
                item.data &&
                String(item.data.resourceType).toLowerCase() === "bundle"
              )
                item.error =
                  (item.error ? item.error + " " : "") +
                  "Unable to process data. CQL execution error. " +
                  (typeof e?.message === "string"
                    ? e?.message
                    : " Please see console for detail.");
            });
          }
          execResults = null;
        }
        return execResults;
      })
      .then((execResults) => {
        //debugging
        console.table("CQL execution results ", execResults);
        let evalResults =
          execResults && execResults.patientResults
            ? execResults.patientResults[
                Object.keys(execResults.patientResults)[0]
              ]
            : {};
        return evalResults;
      })
      .then((evalResults) => {
        //debugging
        console.table("CQL execution results ", evalResults);

        if (!isReportEnabled()) return evalResults;

        // return a promise containing survey evaluated data
        return new Promise((resolve, reject) => {
          if (!evalResults[PATIENT_SUMMARY_KEY]) {
            evalResults[PATIENT_SUMMARY_KEY] = {};
          }
          Promise.allSettled([
            executeELMForReport(patientBundle),
            ...executeELMForInstruments(patientBundle),
          ])
            .then(
              (results) => {
                resourceTypes["Report"] = true;
                let reportResults =
                  results[0].status !== "rejected" ? results[0].value : null;
                if (reportResults && reportResults.patientResults)
                  reportResults =
                    reportResults.patientResults[
                      Object.keys(reportResults.patientResults)[0]
                    ].Summary;
                evalResults[PATIENT_SUMMARY_KEY]["ReportSummary"] =
                  reportResults;
                const surveyLibResults = results
                  .slice(1)
                  .filter((result) => !!result.value);
                if (isEmptyArray(surveyLibResults)) {
                  resolve(evalResults);
                }
                const evaluatedSurveyResults = surveyLibResults
                  .filter((o) => o.value && o.value.patientResults)
                  .map(
                    (o) =>
                      o.value.patientResults[
                        Object.keys(o.value.patientResults)[0]
                      ]
                  );
                const SURVEY_SUMMARY_KEY = "SurveySummary";

                if (!evalResults[PATIENT_SUMMARY_KEY]) {
                  evalResults[PATIENT_SUMMARY_KEY] = {};
                }
                evalResults[PATIENT_SUMMARY_KEY][SURVEY_SUMMARY_KEY] =
                  evaluatedSurveyResults;
                //debug
                console.log(
                  "final evaluated CQL results including surveys ",
                  evaluatedSurveyResults
                );
                resolve(evalResults);
              },
              (e) => {
                console.log(e);
                reject(
                  "Error occurred executing report library logics. See console for detail"
                );
              }
            )
            .catch((e) => {
              console.error("error occurred processing report data ", e);
              reject(e);
            });
        });
      });
    resolve(returnResults);
  });
}

async function executeELMForReport(bundle) {
  if (!bundle) return null;
  let r4ReportCommonELM = await import("../cql/r4/Report_LogicLibrary.json")
    .then((module) => module.default)
    .catch((e) => {
      console.log("Issue occurred loading ELM lib for reoirt", e);
      r4ReportCommonELM = null;
    });

  if (!r4ReportCommonELM) return null;

  let reportLib = new cql.Library(
    r4ReportCommonELM,
    new cql.Repository({
      FHIRHelpers: r4HelpersELM,
    })
  );
  const reportExecutor = new cql.Executor(
    reportLib,
    new cql.CodeService(valueSetDB)
  );
  const patientSource = cqlfhir.PatientSource.FHIRv401();
  patientSource.loadBundles([bundle]);
  let results;
  try {
    results = reportExecutor.exec(patientSource);
    // if (results.patientResults)
    //   results =
    //     results.patientResults[Object.keys(results.patientResults)[0]].Summary;
  } catch (e) {
    results = null;
    console.log(`Error executing CQL for report `, e);
  }
  return results;
}

async function executeELMForInstrument(instrumentKey, libraryElm, bundle) {
  if (!instrumentKey || !libraryElm) return null;
  let surveyLib = new cql.Library(
    libraryElm,
    new cql.Repository({
      FHIRHelpers: r4HelpersELM,
      Common_LogicLibrary: r4SurveyCommonELM,
    })
  );
  const surveyExecutor = new cql.Executor(
    surveyLib,
    new VSACAwareCodeService(valueSetDB),
    {
      dataKey: instrumentKey,
      id: getReportInstrumentIdByKey(instrumentKey),
    }
  );
  const surveyPatientSource = getPatientSource(FHIR_RELEASE_VERSION_4);
  surveyPatientSource.loadBundles([bundle]);
  let surveyResults;
  try {
    surveyResults = surveyExecutor.exec(surveyPatientSource);
  } catch (e) {
    surveyResults = null;
    console.log(`Error executing CQL for ${instrumentKey} `, e);
  }
  return surveyResults;
}

function executeELMForInstruments(patientBundle) {
  const INSTRUMENT_LIST = getReportInstrumentList();
  if (!INSTRUMENT_LIST) return null;
  return INSTRUMENT_LIST.map((item) =>
    (async () => {
      let elmJson = null;
      const libPrefix = item.useDefaultELMLib
        ? "Default"
        : item.key.toUpperCase();
      const STORAGE_KEY = `lib_${libPrefix}_${getEnvVersionString()??(new Date()).toISOString()}`;
      if (
        window &&
        window.localStorage &&
        window.localStorage.getItem(STORAGE_KEY)
      ) {
        elmJson = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      } else {
        elmJson = await import(
          `../cql/r4/survey_resources/${libPrefix}_LogicLibrary.json`
        )
          .then((module) => module.default)
          .catch((e) => {
            console.log(
              "Issue occurred loading ELM lib for " +
                item.key +
                ". Will use default lib.",
              e
            );
            elmJson = null;
          });

        if (!elmJson) {
          elmJson = await import(
            `../cql/r4/survey_resources/Default_LogicLibrary.json`
          ).then((module) => module.default);
          console.log("default for " + item.key, elmJson);
        }
      }
      console.log("eval result for " + item.key, elmJson);
      if (window && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(elmJson));
      }
      const evalResults = await executeELMForInstrument(
        item.key,
        elmJson,
        patientBundle
      );
      return evalResults;
    })()
  );
}

function getLibrary(release) {
  switch (release) {
    case FHIR_RELEASE_VERSION_2:
      return new cql.Library(
        dstu2FactorsELM,
        new cql.Repository({
          CDS_Connect_Commons_for_FHIRv102: dstu2CommonsELM,
          FHIRHelpers: dstu2HelpersELM,
        })
      );
    case FHIR_RELEASE_VERSION_4:
      return new cql.Library(
        r4FactorsELM,
        new cql.Repository({
          CDS_Connect_Commons_for_FHIRv401: r4CommonsELM,
          FHIRHelpers: r4HelpersELM,
          MMECalculator: r4MMECalculatorELM,
          OMTKLogic: r4OMTKLogicELM,
          OMTKData: r4OMTKDataELM,
        })
      );
    default:
      throw new Error("Only FHIR DSTU2 and FHIR R4 servers are supported");
  }
}

function getPatientSource(release) {
  switch (release) {
    case FHIR_RELEASE_VERSION_2:
      return cqlfhir.PatientSource.FHIRv102();
    case FHIR_RELEASE_VERSION_4:
      return cqlfhir.PatientSource.FHIRv401();
    default:
      throw new Error("Only FHIR DSTU2 and FHIR R4 servers are supported");
  }
}

/*
 * @param client, FHIR client object
 * @param uri, path including search parameters if applicable, e.g. Patient?_sort=_lastUpdated
 * return re-constructed URL string including server url if applicable
 */
function getRequestURL(client, uri = "") {
  if (!client) return uri;
  let serverURL = "";
  if (client && client.state) {
    //e.g. https://backend.uwmedicine.cosri.app/fhir-router/4bc20310-8963-4440-b6aa-627ce6def3b9/
    //e.g. https://launch.smarthealthit.org/v/r4/fhir
    serverURL = client.state.serverUrl;
  }
  if (!serverURL) return "";
  let uriToUse = uri;
  if (uriToUse.startsWith("/")) uriToUse = uri.slice(1);
  return serverURL + (!serverURL.endsWith("/") ? "/" : "") + uriToUse;
}

function doSearch(client, release, type, collector, resourceTypes) {
  const params = new URLSearchParams();
  updateSearchParams(params, release, type);

  const resources = [];
  const uri = `${type}?${params}`;
  const nonPatientResourceTypes = ["questionnaire"];
  const isNotPatientResourceType =
    nonPatientResourceTypes.indexOf(type.toLowerCase()) !== -1;
  const options = {
    url: uri,
    headers: noCacheHeader,
  };
  const fhirOptions = {
    pageLimit: 0, // unlimited pages
    onPage: processPage(client, uri, collector, resources),
  };
  return new Promise((resolve) => {
    let results;
    if (isNotPatientResourceType) {
      results = client.request(options, fhirOptions);
    } else {
      results = client.patient.request(options, fhirOptions);
    }
    results
      .then(() => {
        resourceTypes[type] = true;
        resolve(resources);
      })
      .catch((error) => {
        collector.push({ error: error, url: uri, type: type, data: error });
        resourceTypes[type] = true;
        // don't return the error as we want partial results if available
        // (and we don't want to halt the Promis.all that wraps this)
        resolve(resources);
      });
  });
}

function processPage(client, uri, collector, resources) {
  return (bundle) => {
    // Add to the collector
    let url = uri;
    if (
      bundle &&
      bundle.link &&
      bundle.link.some((l) => l.relation === "self" && l.url != null)
    ) {
      bundle.link = bundle.link.map((o) => {
        if (!o.url) return o;
        let reuseURL = null;
        try {
          reuseURL = new URL(o.url);
        } catch (e) {
          console.log(`Unable to create URL object for ${o.url}`, e);
          reuseURL = null;
        }
        if (reuseURL) {
          const requestURL = getRequestURL(client, reuseURL.search);
          if (requestURL) o.url = requestURL;
        }
        // if (o.relation === "next")
        //   console.log("Next URL ", o.url)
        return o;
      });
      url = bundle.link.find((l) => l.relation === "self").url;
    }
    //debugging
    // console.log("collector url? ", url, ", bundle: ", bundle);
    collector.push({ url: url, data: bundle });
    // Add to the resources
    if (bundle.entry) {
      //prevent addition of null entry
      //each entry is not always wrapped in resource node
      bundle.entry.forEach((e) => {
        if (!e) return true;
        let resource = e.resource ? e.resource : e;
        resources.push(resource);
      });
    }
  };
}

function updateSearchParams(params, release, type) {
  if (release === FHIR_RELEASE_VERSION_4) {
    const INSTRUMENT_LIST = getReportInstrumentList().map((item) => item.id);
    if (!isEmptyArray(INSTRUMENT_LIST)) {
      switch (type) {
        case "Questionnaire":
          params.set("_id", INSTRUMENT_LIST.join(","));
          break;
        case "QuestionnaireResponse":
          params.set("_sort", "_lastUpdated");
          params.set("_count", 300);
          break;
        default:
          params.set("_count", 100);
      }
    }
  }
  // If this is for Epic, there are some specific modifications needed for the queries to work properly
  if (isEnvEpicQueries()) {
    if (release === FHIR_RELEASE_VERSION_2) {
      switch (type) {
        case "Observation":
          // Epic requires you to specify a category or code search parameter, so search on all categories
          params.set(
            "category",
            [
              "social-history",
              "vital-signs",
              "imaging",
              "laboratory",
              "procedure",
              "survey",
              "exam",
              "therapy",
            ].join(",")
          );
          break;
        case "MedicationOrder":
          // Epic returns only active meds by default, so we need to specifically ask for other types
          // NOTE: purposefully omitting entered-in-error
          params.set(
            "status",
            ["active", "on-hold", "completed", "stopped", "draft"].join(",")
          );
          break;
        case "MedicationStatement":
          // Epic returns only active meds by default, so we need to specifically ask for other types
          // NOTE: purposefully omitting entered-in-error
          params.set("status", ["active", "completed", "intended"].join(","));
          break;
        default:
        //nothing
      }
    } else if (release === FHIR_RELEASE_VERSION_4) {
      // NOTE: Epic doesn't currently support R4, but assuming R4 versions of Epic would need this
      switch (type) {
        case "Observation":
          // Epic requires you to specify a category or code search parameter, so search on all categories
          params.set(
            "category",
            [
              "social-history",
              "vital-signs",
              "imaging",
              "laboratory",
              "procedure",
              "survey",
              "exam",
              "therapy",
              "activity",
            ].join(",")
          );
          break;
        case "MedicationRequest":
          // Epic returns only active meds by default, so we need to specifically ask for other types
          // NOTE: purposefully omitting entered-in-error
          params.set(
            "status",
            [
              "active",
              "on-hold",
              "cancelled",
              "completed",
              "stopped",
              "draft",
              "unknown",
            ].join(",")
          );
          break;
        case "MedicationStatement":
          // Epic returns only active meds by default, so we need to specifically ask for other types
          // NOTE: purposefully omitting entered-in-error and not-taken
          params.set(
            "status",
            [
              "active",
              "completed",
              "intended",
              "stopped",
              "on-hold",
              "unknown",
            ].join(",")
          );
          break;
        default:
        //nothing
      }
    }
  }
}

export default executeELM;
