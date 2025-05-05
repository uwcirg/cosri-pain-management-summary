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
import valueSetDB from "../cql/valueset-db.json";
import { fetchEnvData } from "./envConfig";
import {
  isEnvEpicQueries,
  getReportInstrumentList,
  isEmptyArray,
} from "../helpers/utility";

export const noCacheHeader = {
  "Cache-Control": "no-cache",
};
export const FHIR_RELEASE_VERSION_2 = 2;
export const FHIR_RELEASE_VERSION_4 = 4;
export const PATIENT_SUMMARY_KEY = "Summary";

export const getResourcesFromBundle = (bundle) => {
  if (isEmptyArray(bundle)) return [];
  let resources = [];
  bundle.forEach((item) => {
    if (String(item.resourceType).toLowerCase() === "bundle") {
      if (item.entry) {
        item.entry.forEach((o) => {
          if (o.resource) resources.push(o.resource);
          else resources.push(o);
        });
      }
    } else resources.push(item);
  });
  return resources.map((r) => ({ resource: r }));
};

export const getResourceTypesFromPatientBundle = (bundle) => {
  if (isEmptyArray(bundle)) return [];
  return [
    ...new Set([
      ...bundle
        .filter((result) => result.resource && result.resource.resourceType)
        .map((result) => result.resource.resourceType),
    ]),
  ];
};

export const extractPatientResourceFromFHIRBundle = (bundle) => {
  if (!bundle || isEmptyArray(bundle.entry)) return null;
  return bundle.entry
    .map((entry) => entry.resource)
    .find((resource) => resource.resourceType === "Patient");
};

export class VSACAwareCodeService extends cql.CodeService {
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

async function executeELM(collector = [], paramResourceTypes = {}) {
  let client, release, library, patientBundle, INSTRUMENT_LIST;
  let resourceTypes = paramResourceTypes || {};
  return new Promise((resolve, reject) => {
    // First get our authorized client and send the FHIR release to the next step
    FHIR.oauth2
      .ready()
      .then((clientArg) => {
        client = clientArg;
        return Promise.allSettled([
          fetchEnvData(),
          client.getFhirRelease(),
          //client.patient.read(),
        ]);
      })
      .catch((e) => {
        console.log("client requests error ", e);
        throw new Error("Client requests error.");
      })
      // then remember the release for later and get the release-specific library
      .then((clientResults) => {
        if (isEmptyArray(clientResults)) {
          throw new Error("No results returned from client requests.");
        }
        if (!clientResults[1] || clientResults[1].status === "rejected")
          throw new Error("Error fetching FHIR release");
  
        release = clientResults[1].value;
        library = getLibrary(release);
        // return all the requests that have been resolved // rejected
        return Promise.allSettled(
          [...new Set([...extractResourcesFromELM(library)])].map((name) => {
            resourceTypes[name] = false;
            return doSearch(client, release, name, collector, resourceTypes);
          })
        );
      })
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
          entry: resources,
        };
        return executeELMForFactors(patientBundle, getPatientSource(release), library);
      })
      .catch((e) => {
        reject(e);
      })
      .then((results) => {
        if (!results) {
          console.log("No results from executing ELM for Factors.");
        }
        const getPatientResults = (result) =>
          result && result.patientResults
            ? result.patientResults[Object.keys(result.patientResults)[0]]
            : {};
        let evalResults = getPatientResults(results);
        if (evalResults) {
          evalResults.bundle = patientBundle;
        }
        resolve(evalResults);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function executeELMForFactors(bundle, patientSource, library) {
  if (!bundle || !patientSource) return null;
  const codeService = new VSACAwareCodeService(valueSetDB);
  const executor = new cql.Executor(library, codeService);
  //debugging
  console.log("bundle loaded? ", bundle);
  console.log(
    "resource types",
    getResourceTypesFromPatientBundle(bundle?.entry)
  );
  patientSource.loadBundles([bundle]);
  let execResults;
  try {
    execResults = executor.exec(patientSource);
  } catch (e) {
    console.log("Error occurred executing CQL ", e);
    execResults = null;
    throw new Error("Unable to execute CQL due to errors.");
  }
  return execResults;
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

export function getPatientSource(release) {
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
export function getRequestURL(client, uri = "") {
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

export function doSearch(client, release, type, collector, resourceTypes = {}) {
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

export function processPage(client, uri, collector, resources) {
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

export function updateSearchParams(params, release, type) {
  if (release === FHIR_RELEASE_VERSION_4) {
    const INSTRUMENT_LIST = getReportInstrumentList().map((item) => item.id);
    if (!isEmptyArray(INSTRUMENT_LIST)) {
      switch (type) {
        case "Questionnaire":
          params.set("_id", INSTRUMENT_LIST.join(","));
          break;
        case "QuestionnaireResponse":
          params.set("_count", 200);
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
