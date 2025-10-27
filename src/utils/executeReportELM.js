import cql from "cql-execution";
import extractResourcesFromELM from "./extractResourcesFromELM";
import r4HelpersELM from "../cql/r4/FHIRHelpers.json";
import r4SurveyCommonELM from "../cql/r4/survey_resources/Common_LogicLibrary.json";
import {
  getReportInstrumentList,
  getReportInstrumentIdByKey,
  getReportLogicLibrary,
  isEmptyArray,
} from "../helpers/utility";
import {
  doSearch,
  FHIR_RELEASE_VERSION_4,
  getPatientSource,
  getResourcesFromBundle,
  getResourceTypesFromPatientBundle,
  VSACAwareCodeService,
} from "./executePainFactorsELM";

async function executeReportELM(
  client,
  paramPatientBundle,
  collector = [],
  paramResourceTypes = {}
) {
  if (!client) {
    throw new Error("Invalid FHIR client.");
  }
  let release = FHIR_RELEASE_VERSION_4,
    patientBundle = paramPatientBundle;
  let resourceTypes = paramResourceTypes || {};
  const resourceLoaded = getResourceTypesFromPatientBundle(
    patientBundle?.entry
  );
  const SURVEY_FHIR_RESOURCES = ["QuestionnaireResponse", "Questionnaire"];
  return new Promise((resolve, reject) => {
    const reportResources = extractResourcesFromELM(getReportLibrary());
    const resourcesToLoad = reportResources.filter(
      (resource) => resourceLoaded.indexOf(resource) === -1
    );
    Promise.allSettled(
      [...new Set([...resourcesToLoad, ...SURVEY_FHIR_RESOURCES])].map(
        (name) => {
          resourceTypes[name] = false;
          return doSearch(client, release, name, collector, resourceTypes);
        }
      )
    )
      .then((requestResults) => {
        if (isEmptyArray(requestResults)) {
          return null;
        }
        let resources = requestResults
          .filter(
            (result) =>
              result.state !== "rejected" && !isEmptyArray(result.value)
          )
          .map((result) => {
            return getResourcesFromBundle(result.value);
          })
          .flat();
        patientBundle = {
          resourceType: "Bundle",
          entry: [
            ...new Set([
              ...(paramPatientBundle.entry ? paramPatientBundle.entry : []),
              ...resources,
            ]),
          ],
        };
        const patientSource = getPatientSource(release);
        try {
          patientSource.loadBundles(patientBundle);
        } catch (e) {
          console.log(e);
          throw new Error("Unable to load patient resource bundle.");
        }
        // return a promise containing survey evaluated data
        return Promise.allSettled([
          // report
          executeELMForReport(patientSource),
          // surey results
          ...executeELMForInstruments(patientSource),
        ]);
      })
      .catch((e) => {
        reject(e);
      })
      .then((results) => {
        if (results[0].status === "rejected") {
          console.log("Executing ELM for Report error ", results[0].reason);
        }
        let evalResults = {};
        const getPatientResults = (result) =>
          result && result.patientResults
            ? result.patientResults[Object.keys(result.patientResults)[0]]
            : {};
        const reportResults = getPatientResults(
          results[0].status !== "rejected" ? results[0].value : null
        );
        evalResults["ReportSummary"] = reportResults.Summary
          ? reportResults.Summary
          : null;
        const surveyLibResults = results
          .slice(1)
          .filter((result) => !!result.value);
        if (isEmptyArray(surveyLibResults)) {
          resolve(evalResults);
        }
        const evaluatedSurveyResults = surveyLibResults
          .filter((o) => o.value && o.value.patientResults)
          .map((o) => getPatientResults(o.value));
        evalResults["SurveySummary"] = evaluatedSurveyResults;
        //debug
        // console.log(
        //   "final evaluated CQL results including surveys ",
        //   evalResults
        // );
        resolve(evalResults);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

function getReportLibrary() {
  let r4ReportCommonELM = getReportLogicLibrary();
  if (!r4ReportCommonELM) return null;
  return new cql.Library(
    r4ReportCommonELM,
    new cql.Repository({
      FHIRHelpers: r4HelpersELM,
    })
  );
}

async function executeELMForReport(patientSource) {
  if (!patientSource) return null;
  let reportLib = getReportLibrary();
  if (!reportLib) return null;
  const reportExecutor = new cql.Executor(
    reportLib,
    new VSACAwareCodeService({})
  );
  let results;
  try {
    results = reportExecutor.exec(patientSource);
  } catch (e) {
    results = null;
    console.log(`Error executing CQL for report `, e);
  }
  return results;
}

async function executeELMForInstrument(
  instrumentKey,
  library,
  surveyPatientSource
) {
  if (!instrumentKey || !library || !surveyPatientSource) return null;
  const surveyExecutor = new cql.Executor(
    library,
    new VSACAwareCodeService({}),
    {
      dataKey: instrumentKey,
      id: getReportInstrumentIdByKey(instrumentKey),
    }
  );
  let surveyResults;
  try {
    surveyResults = surveyExecutor.exec(surveyPatientSource);
  } catch (e) {
    surveyResults = null;
    console.log(`Error executing CQL for ${instrumentKey} `, e);
  }
  return surveyResults;
}

function executeELMForInstruments(patientSource) {
  const INSTRUMENT_LIST = getReportInstrumentList();
  if (!INSTRUMENT_LIST) return null;
  if (!patientSource) return null;
  const repository = new cql.Repository({
    FHIRHelpers: r4HelpersELM,
    Common_LogicLibrary: r4SurveyCommonELM,
  });
  return INSTRUMENT_LIST.map((item) =>
    (async () => {
      const evalResults = executeELMForInstrument(
        item.key,
        new cql.Library(item.library, repository),
        patientSource
      );
      return evalResults;
    })()
  );
}

export default executeReportELM;
