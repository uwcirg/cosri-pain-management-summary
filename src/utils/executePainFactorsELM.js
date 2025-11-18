import cql from "cql-execution";
import cqlfhir from "cql-exec-fhir";
import extractResourcesFromELM from "./extractResourcesFromELM";
import dstu2FactorsELM from "../cql/dstu2/Factors_to_Consider_in_Managing_Chronic_Pain.json";
import dstu2CommonsELM from "../cql/dstu2/CDS_Connect_Commons_for_FHIRv102.json";
import dstu2HelpersELM from "../cql/dstu2/FHIRHelpers.json";
import r4FactorsELM from "../cql/r4/Factors_to_Consider_in_Managing_Chronic_Pain_FHIRv401.json";
import r4CommonsELM from "../cql/r4/CDS_Connect_Commons_for_FHIRv401.json";
import r4HelpersELM from "../cql/r4/FHIRHelpers.json";
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

// Cache for storing fetched resources
const resourceCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  findValueSetsByOid(id) {
    const [oid] = this.extractOidAndVersion(id);
    return super.findValueSetsByOid(oid);
  }

  findValueSet(id, version) {
    const [oid, embeddedVersion] = this.extractOidAndVersion(id);
    return super.findValueSet(oid, version != null ? version : embeddedVersion);
  }

  extractOidAndVersion(id) {
    if (id == null) return [];

    let m = id.match(
      /^https?:\/\/cts\.nlm\.nih\.gov\/fhir\/ValueSet\/([^|]+)(\|(.+))?$/
    );
    if (m) return m[3] == null ? [m[1]] : [m[1], m[3]];

    m = id.match(/^urn:oid:(.+)$/);
    if (m) return [m[1]];

    return [id];
  }
}

function neededTypesFromELM(library) {
  return new Set([...extractResourcesFromELM(library)]);
}

function extractMatchingValueSets(lookup, valueSetJSON) {
  if (!lookup) return {};
  const matches = {};

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

// Priority-based resource fetching
// Fetch critical resources first, then others in parallel
const RESOURCE_PRIORITY = {
  HIGH: ["Patient", "MedicationRequest"],
  MEDIUM: [
    "Condition",
    "Observation",
    "Procedure",
    "Encounter",
    "DocumentReference",
  ],
  LOW: [
    "MedicationStatement",
    "MedicationOrder",
    "Questionnaire",
    "QuestionnaireResponse",
  ],
};

function prioritizeResourceTypes(resourceTypes) {
  const prioritized = { high: [], medium: [], low: [] };

  resourceTypes.forEach((type) => {
    if (RESOURCE_PRIORITY.HIGH.includes(type)) {
      prioritized.high.push(type);
    } else if (RESOURCE_PRIORITY.MEDIUM.includes(type)) {
      prioritized.medium.push(type);
    } else {
      prioritized.low.push(type);
    }
  });

  return prioritized;
}

// **NEW: Get cache key for a request**
function getCacheKey(clientId, type, params) {
  return `${clientId}-${type}-${params.toString()}`;
}

// **NEW: Check if cached data is still valid**
function getCachedResource(cacheKey) {
  const cached = resourceCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    resourceCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

// **NEW: Store resource in cache**
function setCachedResource(cacheKey, data) {
  resourceCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

// parallel batching
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
  const clientId = client.state?.serverUrl || "default";

  try {
    // Get release info and library
    const [envResult, releaseResult] = await Promise.allSettled([
      fetchEnvData(),
      client.getFhirRelease(),
    ]);

    if (!releaseResult || releaseResult.status === "rejected") {
      throw new Error("Error fetching FHIR release");
    }

    release = releaseResult.value;
    library = getLibrary(release);

    // Get all needed resource types
    const neededTypes = [...neededTypesFromELM(library)];

    // Prioritize resources (fetch critical ones first)
    const prioritized = prioritizeResourceTypes(neededTypes);

    console.log("Resource fetch priority:", {
      high: prioritized.high,
      medium: prioritized.medium,
      low: prioritized.low,
    });

    // Fetch resources in priority batches
    const allResources = [];

    // Fetch high priority resources first (parallel within batch)
    if (prioritized.high.length > 0) {
      const highPriorityResults = await fetchResourceBatch(
        client,
        release,
        prioritized.high,
        patient,
        collector,
        resourceTypes,
        clientId,
        "HIGH"
      );
      allResources.push(...highPriorityResults);
    }

    // Fetch medium and low priority in parallel
    const parallelResults = await Promise.allSettled([
      fetchResourceBatch(
        client,
        release,
        prioritized.medium,
        patient,
        collector,
        resourceTypes,
        clientId,
        "MEDIUM"
      ),
      fetchResourceBatch(
        client,
        release,
        prioritized.low,
        patient,
        collector,
        resourceTypes,
        clientId,
        "LOW"
      ),
    ]);

    // Extract successful results, log any failures
    parallelResults.forEach((result, index) => {
      const priority = index === 0 ? "MEDIUM" : "LOW";
      if (result.status === "fulfilled") {
        allResources.push(...result.value);
      } else {
        console.error(`${priority} priority batch failed:`, result.reason);
        // Continue with partial results - error already logged in fetchResourceBatch
      }
    });

    // Build bundle
    patientBundle = {
      resourceType: "Bundle",
      entry: allResources.flat(),
    };

    const patientSource = getPatientSource(release);

    const endTime = Date.now();
    const executionTime = (endTime - startTime).toFixed(2);
    console.log(`Optimized requests total execution time: ${executionTime} ms`);

    return {
      patientBundle,
      library,
      patientSource,
    };
  } catch (e) {
    console.error("Error in executeRequests:", e);
    throw e;
  }
}

// **NEW: Fetch a batch of resources in parallel**
async function fetchResourceBatch(
  client,
  release,
  resourceTypes,
  patient,
  collector,
  resourceTypesStatus,
  clientId,
  priority
) {
  if (resourceTypes.length === 0) return [];

  const batchStart = Date.now();

  try {
    const results = await Promise.allSettled(
      resourceTypes.map(async (type) => {
        try {
          if (String(type).toLowerCase() === "patient" && patient) {
            resourceTypesStatus[type] = true;
            return getResourcesFromBundle([patient]);
          }

          resourceTypesStatus[type] = false;
          return await doSearchOptimized(
            client,
            release,
            type,
            collector,
            resourceTypesStatus,
            clientId
          );
        } catch (error) {
          console.error(`Error fetching ${type} in ${priority} batch:`, error);
          resourceTypesStatus[type] = true; // Mark as done even if failed
          return []; // Return empty array on error
        }
      })
    );

    const batchEnd = Date.now();
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failCount = results.filter((r) => r.status === "rejected").length;

    console.log(
      `${priority} priority batch (${resourceTypes.join(", ")}) ` +
        `took ${(batchEnd - batchStart).toFixed(2)}ms ` +
        `[✓ ${successCount} ✗ ${failCount}]`
    );

    // Return all fulfilled results, empty arrays for rejected
    return results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value || [];
      }
      return []; // Return empty for rejected promises
    });
  } catch (error) {
    // Catch-all in case Promise.allSettled itself fails (very rare)
    console.error(`Critical error in ${priority} batch:`, error);
    return []; // Return empty array to allow other batches to continue
  }
}

// Search with caching and pagination limits
export function doSearchOptimized(
  client,
  release,
  type,
  collector,
  resourceTypes = {},
  clientId
) {
  const params = new URLSearchParams();
  updateSearchParams(params, release, type);

  // Check cache first
  const cacheKey = getCacheKey(clientId, type, params);
  const cached = getCachedResource(cacheKey);

  if (cached) {
    console.log(`Using cached data for ${type}`);
    resourceTypes[type] = true;
    return Promise.resolve(cached);
  }

  const resources = [];
  const uri = `${type}?${params}`;
  const isNotPatientResourceType = ["questionnaire"].includes(
    type.toLowerCase()
  );

  const options = { url: uri, headers: noCacheHeader };

  // **OPTIMIZATION: Add page limit based on resource type**
  const pageLimit = getPageLimitForResourceType(type);

  const fhirOptions = {
    pageLimit: pageLimit,
    onPage: processPage(client, uri, collector, resources),
  };

  const req = isNotPatientResourceType
    ? client.request(options, fhirOptions)
    : client.patient.request(options, fhirOptions);

  return req
    .then(() => {
      resourceTypes[type] = true;
      const bundledResources = getResourcesFromBundle(resources);

      // Cache the results
      setCachedResource(cacheKey, bundledResources);

      return bundledResources;
    })
    .catch((error) => {
      console.error(`Error fetching ${type}:`, error);
      collector.push({ error, url: uri, type, data: error });
      resourceTypes[type] = true;
      return getResourcesFromBundle(resources); // Return partial results
    });
}

// Determine appropriate page limit based on resource type
function getPageLimitForResourceType(type) {
  // For resources that typically have many entries, limit pagination
  const HIGH_VOLUME_TYPES = ["MedicationRequest", "QuestionnaireResponse"];
  const MEDIUM_VOLUME_TYPES = ["Observation", "Procedure"];

  if (HIGH_VOLUME_TYPES.includes(type)) {
    return 10; // Fetch up to 5 pages
  } else if (MEDIUM_VOLUME_TYPES.includes(type)) {
    return 15; // Fetch up to 10 pages
  }

  return 0; // Fetch all pages for other types
}

export function doSearch(client, release, type, collector, resourceTypes = {}) {
  return doSearchOptimized(
    client,
    release,
    type,
    collector,
    resourceTypes,
    "default"
  );
}

export async function executeELMForFactors(bundle, patientSource, library) {
  if (!bundle || !patientSource) return null;

  const cqlStartTime = Date.now();

  const codeService = new VSACAwareCodeService(
    extractMatchingValueSets(library?.valuesets, valueSetDB)
  );
  const executor = new cql.Executor(library, codeService);

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
    console.error("Error occurred executing CQL", e);
    throw new Error("Unable to execute CQL due to errors.");
  }

  const cqlEndTime = Date.now();

  console.log({
    "In execute ELM: minify patient bundle (ms)": (t1 - t0).toFixed(1),
    "In execute ELM: load patient bundle (ms)": (t2 - t1).toFixed(1),
    "In execute ELM: execute CQL (ms)": (t3 - t2).toFixed(1),
    "total (ms)": (t3 - t0).toFixed(1),
  });
  console.log(
    "CQL execution time",
    (cqlEndTime - cqlStartTime).toFixed(1),
    "ms"
  );

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

export function getRequestURL(client, uri = "") {
  if (!client) return uri;
  let serverURL = "";
  if (client && client.state) {
    serverURL = client.state.serverUrl;
  }
  if (!serverURL) return "";
  let uriToUse = uri;
  if (uriToUse.startsWith("/")) uriToUse = uriToUse.slice(1);
  return serverURL + (!serverURL.endsWith("/") ? "/" : "") + uriToUse;
}

export function processPage(client, uri, collector, resources) {
  return (bundle) => {
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
        return o;
      });
      url = bundle.link.find((l) => l.relation === "self").url;
    }

    collector.push({ url: url, data: bundle });

    if (bundle.entry) {
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

  if (isEnvEpicQueries()) {
    if (release === FHIR_RELEASE_VERSION_2) {
      switch (type) {
        case "Observation":
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
          params.set(
            "status",
            ["active", "on-hold", "completed", "stopped", "draft"].join(",")
          );
          break;
        case "MedicationStatement":
          params.set("status", ["active", "completed", "intended"].join(","));
          break;
        default:
      }
    } else if (release === FHIR_RELEASE_VERSION_4) {
      switch (type) {
        case "Observation":
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
      }
    }
  }
}

// **NEW: Utility to clear cache (call when needed)**
export function clearResourceCache() {
  resourceCache.clear();
  console.log("Resource cache cleared");
}

// **NEW: Utility to get cache stats**
export function getCacheStats() {
  return {
    size: resourceCache.size,
    entries: Array.from(resourceCache.keys()),
  };
}
