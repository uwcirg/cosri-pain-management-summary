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
  noCacheHeader,
} from "../helpers/utility";

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

function neededTypesFromELM(library) {
  return new Set([...extractResourcesFromELM(library)]);
}

/**
 * Extract matching ValueSets from a ValueSet collection
 * @param {Object} lookup - object keyed by name with { name, id }
 * @param {Object} valueSetJSON - object keyed by OID with date/version/code info
 * @returns {Object} subset of valueSetJSON with matching IDs
 */
function extractMatchingValueSets(lookup, valueSetJSON) {
  if (!lookup) return {};
  const matches = {};

  // Normalize all lookup IDs (strip prefix and make consistent)
  // example: { "Conditions associated with chronic pain": { "name": "Conditions associated with chronic pain", "id": "https://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1032.37" }, "Opioid Pain Medications": { "name": "Opioid Pain Medications", "id": "https://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1032.34" }
  const lookupIds = Object.values(lookup)
    .map((v) => (v.id.includes("/") ? v.id.split("/").pop() : v.id))
    .reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {});

  for (const [oid, details] of Object.entries(valueSetJSON ?? {})) {
    if (lookupIds[oid]) {
      matches[oid] = details;
    }
  }

  return matches;
}

function minifyBundleForCQL(bundle, library, keepPredicate = null) {
  const needed = neededTypesFromELM(library);
  const minimizedEntries = [];
  for (const e of bundle.entry || []) {
    const r = e.resource || e;
    if (!r || !needed.has(r.resourceType)) continue;
    if (keepPredicate && !keepPredicate(r)) continue;
    minimizedEntries.push({ resource: r });
  }
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: minimizedEntries,
  };
}

export async function executeRequests(
  client,
  patient,
  collector = [],
  paramResourceTypes = {}
) {
  let release, library, patientBundle;
  let resourceTypes = paramResourceTypes || {};
  if (!client) {
    throw new Error("Invalid FHIR client.");
  }
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    // First get our authorized client and send the FHIR release to the next step
    Promise.allSettled([
      fetchEnvData(),
      client.getFhirRelease(),
      //client.patient.read(),
    ])
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
          [...neededTypesFromELM(library)].map((name) => {
            if (String(name).toLowerCase() === "patient" && patient) {
              resourceTypes[name] = true;
              return [patient];
            }
            resourceTypes[name] = false;
            return doSearch(client, release, name, collector, resourceTypes);
          })
        );
      })
      .then((requestResults) => {
        const endTime = Date.now();
        const executionTime = (endTime - startTime).toFixed(2);
        console.log(`Requests total execution time: ${executionTime} ms`);
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
        const patientSource = getPatientSource(release);
        resolve({
          patientBundle,
          library,
          patientSource,
        });
      })
      .catch((e) => {
        reject(e);
      });
  });
}

export async function executeELMForFactors(bundle, patientSource, library) {
  if (!bundle || !patientSource) return null;
   let cqlStartTime = Date.now(),
    cqlEndTime = Date.now();
  const codeService = new VSACAwareCodeService(
    extractMatchingValueSets(library?.valuesets, valueSetDB)
  );
  const executor = new cql.Executor(library, codeService);
  //debugging
  // console.log("bundle loaded? ", bundle);
  // console.log(
  //   "resource types",
  //   getResourceTypesFromPatientBundle(bundle?.entry)
  // );
  const t0 = Date.now();
  const minBundle = minifyBundleForCQL(bundle, library);
  const t1 = Date.now();
  patientSource.loadBundles([minBundle]);
  const t2 = Date.now();
  let execResults;
  let t3;
  try {
    execResults = await executor.exec(patientSource);
    t3 = Date.now();
  } catch (e) {
    console.log("Error occurred executing CQL ", e);
    execResults = null;
    throw new Error("Unable to execute CQL due to errors.");
  }

  cqlEndTime = Date.now();
  //console.log("CQL execution results ", execResults);
  console.log({
    "In execute ELM: minify patient bundle (ms)": (t1 - t0).toFixed(1),
    "In execute ELM: load patient bundle (ms)": (t2 - t1).toFixed(1),
    "In execute ELM: execute CQL (ms)": (t3 - t2).toFixed(1),
    "total (ms)": (t3 - t0).toFixed(1),
    // expressionMs: (t5- t4).toFixed(1)
  });
  console.log("CQL execution time ", (cqlEndTime - cqlStartTime).toFixed(1), " ms")
  //return execResults;
  const getPatientResults = (result) =>
    result && result.patientResults
      ? result.patientResults[Object.keys(result.patientResults)[0]]
      : {};
  let evalResults = getPatientResults(execResults);
  if (evalResults) {
    evalResults.bundle = bundle;
  }
  return evalResults;
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
  if (uriToUse.startsWith("/")) uriToUse = uriToUse.slice(1);
  return serverURL + (!serverURL.endsWith("/") ? "/" : "") + uriToUse;
}

export function doSearch(client, release, type, collector, resourceTypes = {}) {
  const params = new URLSearchParams();
  updateSearchParams(params, release, type);

  const resources = [];
  const uri = `${type}?${params}`;
  const isNotPatientResourceType = ["questionnaire"].includes(
    type.toLowerCase()
  );

  const options = { url: uri, headers: noCacheHeader };
  const fhirOptions = {
    pageLimit: 0,
    onPage: processPage(client, uri, collector, resources),
  };

  const req = isNotPatientResourceType
    ? client.request(options, fhirOptions)
    : client.patient.request(options, fhirOptions);

  return req
    .then(() => {
      resourceTypes[type] = true;
      return resources;
    })
    .catch((error) => {
      collector.push({ error, url: uri, type, data: error });
      resourceTypes[type] = true;
      return resources; // keep partials; don't reject
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
