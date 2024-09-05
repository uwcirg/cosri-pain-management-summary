import FHIR from "fhirclient";
import cql from "cql-execution";
import cqlfhir from "cql-exec-fhir";
import extractResourcesFromELM from "./extractResourcesFromELM";
import dstu2FactorsELM from "../cql/dstu2/Factors_to_Consider_in_Managing_Chronic_Pain.json";
import dstu2CommonsELM from "../cql/dstu2/CDS_Connect_Commons_for_FHIRv102.json";
import dstu2HelpersELM from "../cql/dstu2/FHIRHelpers.json";
import r4FactorsELM from "../cql/r4/Factors_to_Consider_in_Managing_Chronic_Pain_FHIRv400.json";
import r4CommonsELM from "../cql/r4/CDS_Connect_Commons_for_FHIRv400.json";
import r4HelpersELM from "../cql/r4/FHIRHelpers.json";
import r4MMECalculatorELM from "../cql/r4/MMECalculator.json";
import r4OMTKDataELM from "../cql/r4/OMTKData.json";
import r4OMTKLogicELM from "../cql/r4/OMTKLogic.json";
import r4SurveyCommonELM from "../cql/r4/survey_resources/Common_LogicLibrary.json";
import valueSetDB from "../cql/valueset-db.json";
import { fetchEnvData } from "./envConfig";
import {
  isEnvEpicQueries,
  getReportInstrumentList,
  getReportInstrumentIdByKey,
  isEmptyArray,
  isReportEnabled,
} from "../helpers/utility";

const noCacheHeader = {
  "Cache-Control": "no-cache, no-store, max-age=0",
};
const FHIR_RELEASE_VERSION_2 = 2;
const FHIR_RELEASE_VERSION_4 = 4;

async function executeELM(collector, oResourceTypes) {
  fetchEnvData();
  let client, release, library, patientBundle;
  const resourceTypes = oResourceTypes || {};
  const INSTRUMENT_LIST = isReportEnabled() ? getReportInstrumentList() : null;
  const SURVEY_FHIR_RESOURCES = ["QuestionnaireResponse", "Questionnaire"];
  console.log("instrument list to be loaded for report: ", INSTRUMENT_LIST);
  return new Promise((resolve) => {
    // First get our authorized client and send the FHIR release to the next step
    const finalResults = FHIR.oauth2
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
          ? SURVEY_FHIR_RESOURCES
          : [];
        const requests = [
          ...extractResourcesFromELM(library),
          ...surveyResources,
        ].map((name) => {
          resourceTypes[name] = false;
          if (name === "Patient") {
            resourceTypes[name] = true;
            return [pt];
          }
          let p = doSearch(client, release, name, collector);
          return p.then((resource) => {
            resourceTypes[name] = true;
            return resource;
          });
        });
        //console.log("collector ", collector);
        //console.log("resourceTypes ", resourceTypes);

        // return all the requests have been resolved // rejected
        return Promise.allSettled(requests).then((requestResults) => {
          let resources = [];
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
        });
      })
      // then execute the library and return the results (wrapped in a Promise)
      .then((bundle) => {
        const patientSource = getPatientSource(release);
        const codeService = new cql.CodeService(valueSetDB);
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

        if (!INSTRUMENT_LIST) return evalResults;

        // return a promise containing survey evaluated data
        return new Promise((resolve, reject) => {
          const elmLibs = getLibraryForInstruments();
          Promise.allSettled(elmLibs).then(
            (elmResults) => {
              const evaluatedSurveyResults = executeELMForInstruments(
                elmResults,
                patientBundle
              );
              const PATIENT_SUMMARY_KEY = "Summary";
              const SURVEY_SUMMARY_KEY = "SurveySummary";

              if (!evalResults[PATIENT_SUMMARY_KEY]) {
                evalResults[PATIENT_SUMMARY_KEY] = {};
              }
              evalResults[PATIENT_SUMMARY_KEY][SURVEY_SUMMARY_KEY] =
                evaluatedSurveyResults;
              //debug
              console.log(
                "final evaluated CQL results including surveys ",
                evalResults
              );
              resolve(evalResults);
            },
            (e) => {
              console.log(e);
              reject(
                "Error occurred importing ELM lib. See console for detail"
              );
            }
          );
        });
      });
    resolve(finalResults);
  });
}

function executeELMForInstruments(arrayElmPromiseResult, bundle) {
  if (!arrayElmPromiseResult) return [];
  let evalResults = [];
  arrayElmPromiseResult.forEach((o) => {
    if (o.status === "rejected") return true;
    const entries = Object.entries(o.value);
    const qKey = entries[0][0];
    const elm = entries[0][1];
    if (!elm) {
      return true;
    }
    let surveyLib = new cql.Library(
      elm,
      new cql.Repository({
        FHIRHelpers: r4HelpersELM,
        Common_LogicLibrary: r4SurveyCommonELM,
      })
    );
    const surveyExecutor = new cql.Executor(
      surveyLib,
      new cql.CodeService(valueSetDB),
      {
        dataKey: qKey,
        id: getReportInstrumentIdByKey(qKey),
      }
    );
    const surveyPatientSource = cqlfhir.PatientSource.FHIRv400();
    surveyPatientSource.loadBundles([bundle]);
    let surveyResults;
    try {
      surveyResults = surveyExecutor.exec(surveyPatientSource);
    } catch (e) {
      surveyResults = null;
      console.log(`Error executing CQL for ${qKey} `, e);
    }
    let evalSurveyResult;
    if (surveyResults && surveyResults.patientResults) {
      evalSurveyResult =
        surveyResults.patientResults[
          Object.keys(surveyResults.patientResults)[0]
        ];
      evalSurveyResult.dataKey = qKey;
      evalResults.push(evalSurveyResult);
    }
    //debugging
    console.log("evaluated results for ", qKey, evalSurveyResult);
  });
  return evalResults;
}

function getLibraryForInstruments() {
  const INSTRUMENT_LIST = getReportInstrumentList();
  if (!INSTRUMENT_LIST) return null;
  return INSTRUMENT_LIST.map((item) =>
    (async () => {
      let elmJson = null;
      elmJson = await import(
        `../cql/r4/survey_resources/${item.key.toUpperCase()}_LogicLibrary.json`
      )
        .then((module) => module.default)
        .catch((e) => {
          console.log("Issue occurred loading ELM  lib for " + item.key, e);
          elmJson = null;
        });
      if (!elmJson) {
        elmJson = await import(
          `../cql/r4/survey_resources/Default_LogicLibrary.json`
        ).then((module) => module.default);
      }
      return {
        [item.key]: elmJson,
      };
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
          CDS_Connect_Commons_for_FHIRv102: r4CommonsELM,
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
      return cqlfhir.PatientSource.FHIRv400();
    default:
      throw new Error("Only FHIR DSTU2 and FHIR R4 servers are supported");
  }
}

function doSearch(client, release, type, collector) {
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
    onPage: processPage(uri, collector, resources),
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
        return resources;
      })
      .catch((error) => {
        collector.push({ error: error, url: uri, type: type, data: error });
        // don't return the error as we want partial results if available
        // (and we don't want to halt the Promis.all that wraps this)
        return resources;
      });
    resolve(results);
  });
}

function processPage(uri, collector, resources) {
  return (bundle) => {
    // Add to the collector
    let url = uri;
    if (
      bundle &&
      bundle.link &&
      bundle.link.some((l) => l.relation === "self" && l.url != null)
    ) {
      url = bundle.link.find((l) => l.relation === "self").url;
    }
    //debugging
    //console.log("collector url? ", url, ", bundle: ", bundle)
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
          params.set("_count", 300);
          params.set("_sort", "_lastUpdated");
          break;
        default:
        // nothing
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
