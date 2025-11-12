import { datishFormat, dateFormat } from "../../helpers/formatit";
import flagit from "../../helpers/flagit";
import {
  getEnvConfidentialAPIURL,
  getEnvSystemType,
  getSiteId,
  isEmptyArray,
  isNumber,
  isWithinPastYears,
  saveData,
  writeToLog,
} from "../../helpers/utility";
import MMECalculator from "../../utils/MMECalculator";
import OMTKLogic from "../../utils/MMECalculator/OMTKLogic";
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

// helper: normalize anything flagit returns into [{ text, class, date }]
function normalizeFlagResults(flagResult, alertMapping) {
  if (!flagResult) return [];
  const asArray = Array.isArray(flagResult) ? flagResult : [flagResult];

  return asArray
    .filter(Boolean)
    .map((f) => {
      if (typeof f === "string") {
        return { text: f, class: "", date: alertMapping?.dateField ?? null };
      }
      // object from flagit: { text, class, date }
      const text = f.text ?? "";
      const cls = f.class ?? "";
      const date = f.date != null ? f.date : alertMapping?.dateField ?? null;
      return { text, class: cls, date };
    })
    .filter((f) => f.text); // must have text to display
}

// helper: deduplicate by flagText (case-insensitive, trimmed)
function dedupeFlags(flags) {
  const seen = new Set();
  return flags.filter((f) => {
    const key = f.text?.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getProcessedSummaryData(summary, summaryMap) {
  let sectionFlags = {};
  const sectionKeys = Object.keys(summaryMap || {});
  let flaggedCount = 0;

  sectionKeys.forEach((sectionKey) => {
    sectionFlags[sectionKey] = {};

    if (summaryMap[sectionKey]?.hideSection) {
      summary[sectionKey] = [];
      return;
    }

    (summaryMap[sectionKey]?.sections || []).forEach((subSection) => {
      if (!subSection) return;
      const keySource = summary[subSection.dataKeySource];
      if (!keySource) return;

      if (subSection.hideSection) {
        keySource[subSection.dataKey] = [];
        return;
      }

      const data = keySource[subSection.dataKey];
      const entries = (Array.isArray(data) ? data : [data]).filter(Boolean);
      const alertMapping = subSection.alertMapping || {};

      if (entries.length > 0) {
        let flaggedEntries = [];

        for (const entry of entries) {
          if (entry._id == null) entry._id = generateUuid();

          const flagResult = flagit(entry, subSection, summary);
          const normalized = dedupeFlags(
            normalizeFlagResults(flagResult, alertMapping)
          );

          for (const f of normalized) {
            flaggedCount += 1;
            const flagDateField = f.date ?? alertMapping?.dateField ?? null;
            const flagDateText =
              entry && flagDateField && entry[flagDateField]
                ? dateFormat("", entry[flagDateField])
                : "";

            flaggedEntries.push({
              entryId: entry._id,
              entry,
              subSection,
              flagText: f.text,
              flagClass: f.class || "",
              flagCount: flaggedCount,
              flagDateText,
              priority:
                (f.class === "info" && 1000) || alertMapping.priority || 0,
            });
          }
        }
        sectionFlags[sectionKey][subSection.dataKey] = flaggedEntries;
      } else {
        const sectionFlagResult = flagit(null, subSection, summary);
        const normalized = normalizeFlagResults(
          sectionFlagResult,
          alertMapping
        );
        const unique = dedupeFlags(normalized);

        if (unique.length) {
          sectionFlags[sectionKey][subSection.dataKey] = unique.map((f) => {
            flaggedCount += 1;
            return {
              flagText: f.text,
              flagCount: flaggedCount,
              flagClass: f.class,
              subSection,
              priority: alertMapping.priority || 0,
            };
          });
        }
      }
    });
  });

  return { sectionFlags, flaggedCount };
}

export function getProcessedMMEData(summaryData) {
  if (!summaryData) return [];
  if (!summaryData["RiskConsiderations"])
    summaryData["RiskConsiderations"] = {};
  const allOpioidMedSections =
    summaryData["RiskConsiderations"]["AllOpioidMedicationRequests"] ?? [];
  const mmeData = allOpioidMedSections?.map((med) => {
    const mmeResult = MMECalculator.mme([med.medicationRequest]);
    const resultObject = !isEmptyArray(mmeResult) ? mmeResult[0] : {};
    const {
      mme,
      rxNormCode,
      doseQuantity,
      dosesPerDay,
      strength,
      conversionFactor,
    } = resultObject;
    return {
      ...med,
      rxNormCode,
      rxCUI: rxNormCode?.code,
      doseQuantity,
      dosesPerDay,
      strength,
      conversionFactor,
      MME: isNumber(mme) ? mme.toFixed(2): null,
    };
  });
  summaryData["RiskConsiderations"]["ReportMME"] = mmeData;
  const PDMPMeds =
    summaryData["PDMPMedications"] &&
    summaryData["PDMPMedications"]["PDMPMedications"]
      ? summaryData["PDMPMedications"]["PDMPMedications"]
      : [];
  summaryData["PDMPMedications"]["PDMPMedications"] = PDMPMeds.map((med) => {
    med.MME = mmeData.find((m) => m.ID === med.ID)?.MME;
    return med;
  });
  summaryData["RiskConsiderations"]["ReportMMEByDates"] = Array.from(
    mmeData
      .filter((med) => isNumber(med.MME) && med.End && med.IsLastTwoYears)
      .reduce((map, med) => {
        const key = `${med.Start}|${med.End}|${med.rxCUI}|${med.MME}`;
        if (!map.has(key)) {
          const { Start, End, rxNormCode, rxCUI, MME } = med;
          map.set(key, { Start, End, rxNormCode, rxCUI, MME, MMEValue: MME });
        }
        return map;
      }, new Map())
      .values()
  );
  return summaryData;
}

export function getSummaryGraphDataSet(graphConfig, summaryData) {
  if (!summaryData || !graphConfig?.summaryDataSource) return null;

  // Demo path short-circuit
  if (graphConfig.demoConfigKey && getEnv(graphConfig.demoConfigKey)) {
    return graphConfig.demoData ?? null;
  }

  const sections = Array.isArray(graphConfig.summaryDataSource)
    ? graphConfig.summaryDataSource
    : [];

  const graphDataSet = {};
  let hasAny = false;

  // Build from configured sections
  for (const cfg of sections) {
    const s = summaryData?.[cfg.section_key]?.[cfg.subSection_key];
    if (Array.isArray(s) && s.length) {
      const sectionKey = cfg.key ?? `${cfg.section_key}_${cfg.subSection_key}`;
      const processed = getProcessedGraphData(graphConfig, s); // no deep clone
      if (processed && processed.length) {
        graphDataSet[sectionKey] = { ...cfg, data: processed };
        hasAny = true;
      }
    }
  }

  // Fallback to default only if nothing found above
  if (!hasAny) {
    const d = graphConfig.defaultDataSource;
    const s = d && summaryData?.[d.section_key]?.[d.subSection_key];
    if (Array.isArray(s) && s.length) {
      const processed = getProcessedGraphData(graphConfig, s);
      if (processed && processed.length) {
        graphDataSet[d.key] = { ...d, data: processed };
        hasAny = true;
      }
    }
  }

  // Avoid returning a large empty object and skip console noise in production
  return hasAny ? graphDataSet : null;
}

// Daily cumulative MME, starting from the day BEFORE the earliest start (0 value)
// and extending through today (zeros when no meds are active).
export function getProcessedGraphData(graphConfig, graphDataSource) {
  if (isEmptyArray(graphDataSource)) return [];
  const startDateFieldName = graphConfig.startDateField;
  const endDateFieldName = graphConfig.endDateField;
  const MMEValueFieldName = graphConfig.mmeField;
  const graphDateFieldName = graphConfig.graphDateField;

  const PLACEHOLDER_FIELD_NAME = "placeholder";
  const START_DELIMITER_FIELD_NAME = "start_delimiter";
  const FINAL_CALCULATED_FIELD_FLAG = "final";

  const inclusiveEnd = graphConfig.endInclusive !== false; // default: true
  const capAtToday = graphConfig.capAtToday !== false; // default: true

  // ===== UTC-safe helpers =====
  const DAY_MS = 24 * 60 * 60 * 1000;
  const clamp0 = (n) => (n < 0 ? 0 : n);
  const getNum = (v) => (v !== null && !isNaN(v) ? Number(v) : 0);

  function normalizeYMD(input) {
    const s = String(input || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
  }
  function toMsUTC(ymd) {
    const s = normalizeYMD(ymd);
    if (!s) return NaN;
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  }
  function toYMDUTC(msUTC) {
    const dt = new Date(msUTC);
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dt.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function todayYMDUTC() {
    const now = new Date();
    return toYMDUTC(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
  }

  // Build deltas and track first/last boundaries
  const delta = new Map(); // Map<msUTC, number>
  const startDays = new Set(); // Set<"YYYY-MM-DD">
  let minMs = Infinity;
  let maxEndMs = -Infinity; // last course's end (inclusive day)

  //console.log("graphDataSource ", graphDataSource)

  for (const item of graphDataSource) {
    const sMs = toMsUTC(item?.[startDateFieldName]);
    const eMs = toMsUTC(item?.[endDateFieldName]);
    if (!Number.isFinite(sMs) || !Number.isFinite(eMs) || eMs < sMs) continue;

    const mme = clamp0(getNum(item?.[MMEValueFieldName]));
    if (mme === 0) continue;

    // + on start day
    delta.set(sMs, (delta.get(sMs) ?? 0) + mme);
    startDays.add(toYMDUTC(sMs));

    // drop on day after end (inclusive), or on end day if exclusive
    const dropMs = inclusiveEnd ? eMs + DAY_MS : eMs;
    delta.set(dropMs, (delta.get(dropMs) ?? 0) - mme);

    if (sMs < minMs) minMs = sMs;
    if (eMs > maxEndMs) maxEndMs = eMs;
  }

  if (!Number.isFinite(minMs)) {
    if (!capAtToday) return [];
    const tYMD = todayYMDUTC();
    return [
      {
        [graphDateFieldName]: tYMD,
        [MMEValueFieldName]: 0,
        [PLACEHOLDER_FIELD_NAME]: true,
        [FINAL_CALCULATED_FIELD_FLAG]: true,
      },
    ];
  }

  // We want:
  // - a pre-start zero at minMs - 1 day
  // - days from minMs through endMs
  // - ensure the "trailing zero" day (lastEnd+1) is included when appropriate
  const preStartMs = minMs - DAY_MS;
  const todayMs = toMsUTC(todayYMDUTC());
  const lastDropMs = inclusiveEnd ? maxEndMs + DAY_MS : maxEndMs;

  let endMs;
  if (capAtToday) {
    // cap at today; include trailing zero day only if it is <= today
    endMs = todayMs;
  } else {
    // not capped => ensure we include the trailing zero day
    endMs = Math.max(maxEndMs, lastDropMs);
  }

  const out = [];
  let cum = 0;

  // Pre-start 0
  if (preStartMs <= endMs) {
    out.push({
      [graphDateFieldName]: toYMDUTC(preStartMs),
      [MMEValueFieldName]: 0,
      [PLACEHOLDER_FIELD_NAME]: true,
    });
  }

  // Walk each day through endMs
  for (let t = minMs; t <= endMs; t += DAY_MS) {
    if (delta.has(t)) cum += delta.get(t);
    cum = clamp0(cum);
    const ymd = toYMDUTC(t);
    const isStart = startDays.has(ymd);
    const row = {
      [graphDateFieldName]: ymd,
      [MMEValueFieldName]: Math.round(cum),
    };
    if (isStart) row[START_DELIMITER_FIELD_NAME] = true;
    else row[PLACEHOLDER_FIELD_NAME] = true;
    out.push(row);
  }

  // If capped at today AND today is after the trailing zero day, it's already included.
  // If capped before trailing zero day, we *should not* imply finish; do nothing.
  // If NOT capped, ensure the trailing zero day (lastDropMs) exists (it may already if endMs >= lastDropMs).
  if (!capAtToday && lastDropMs > endMs) {
    out.push({
      [graphDateFieldName]: toYMDUTC(lastDropMs),
      [MMEValueFieldName]: 0,
      [PLACEHOLDER_FIELD_NAME]: true,
    });
  }

  // Final flag on last row
  out[out.length - 1][FINAL_CALCULATED_FIELD_FLAG] = true;

  return out;
}
export function getFlagTextByItem(flagItem) {
  if (!flagItem) return "";
  if (flagItem.flagTextBySite) {
    const siteId = getSiteId();
    const siteKey = siteId ? siteId.toLowerCase() : "";
    if (siteKey && flagItem.flagTextBySite[siteKey])
      return flagItem.flagTextBySite[siteKey];
    return flagItem.flagText ?? "";
  }
  if (flagItem.flagText) return flagItem.flagText;
  return "";
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
          const subSectionFlagText = getFlagTextByItem(subsection[1]);
          if (Array.isArray(subsection[1])) {
            subsection[1].forEach((subitem) => {
              const subItemFlagText = getFlagTextByItem(subitem);
              //this prevents addition of duplicate alert text
              let alertTextExist = alerts.filter((item) => {
                const itemFlagText = getFlagTextByItem(item);
                return (
                  String(itemFlagText).toLowerCase() ===
                  String(subItemFlagText).toLowerCase()
                );
              });
              if (!alertTextExist.length && subItemFlagText) {
                let flagDateText = subitem.flagDateText
                  ? subitem.flagDateText
                  : "";
                alerts.push({
                  id: subitem.subSection.dataKey,
                  name: subitem.subSection.name,
                  flagText: subItemFlagText,
                  className: subitem.flagClass,
                  text:
                    subItemFlagText.indexOf("[DATE]") >= 0
                      ? subItemFlagText.replace(
                          "[DATE]",
                          datishFormat("", flagDateText)
                        )
                      : subItemFlagText +
                        (subitem.flagDateText
                          ? ` (${datishFormat("", flagDateText)})`
                          : ""),
                  priority: subitem.priority || 100,
                });
                //log alert
                if (logParams)
                  writeToLog(
                    "alert flag: " + subItemFlagText,
                    "warn",
                    logParams
                  );
              }
            });
          } else if (subSectionFlagText) {
            alerts.push({
              id: subsection[1].subSection.dataKey,
              name: subsection[1].subSection.name,
              text: subSectionFlagText,
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

export function getDailyMMEData(mmeData) {
  if (!mmeData) return null;
  if (!mmeData.default) return null;
  return mmeData.default["data"];
}

export function HasNaloxoneInLastYear(summaryData) {
  if (
    !summaryData ||
    !summaryData["RiskConsiderations"] ||
    !summaryData["RiskConsiderations"]["NaloxoneMedications"]
  )
    return null;
  const naxList = summaryData["RiskConsiderations"]["NaloxoneMedications"];
  return !!naxList.find((M) => isWithinPastYears(M.AuthoredOn, 1));
}

export function MedicationRequestsForNaloxoneConsideration(summaryData) {
  if (HasNaloxoneInLastYear(summaryData)) return null;
  return NonBupMedRequestsForNaloxoneConsiderationLastTwoYears(summaryData);
}

export function NonBupMedRequestsForNaloxoneConsiderationLastTwoYears(
  summaryData
) {
  const nonBupMedList = GetNonBuprenorphineMMEListByDates(summaryData);
  if (isEmptyArray(nonBupMedList)) return null;
  return nonBupMedList
    .filter((M) => M.MMEValue >= 50 && isWithinPastYears(M.End, 2))
    .sort((a, b) => new Date(b.End) - new Date(a.End));
}

export function GetBuprenorphineMMEListByDates(summaryData) {
  if (
    !summaryData ||
    !summaryData["RiskConsiderations"] ||
    !summaryData["RiskConsiderations"]["ReportMMEByDates"]
  )
    return [];
  if (isEmptyArray(summaryData["RiskConsiderations"]["ReportMMEByDates"]))
    return [];
  const mmeList = summaryData["RiskConsiderations"]["ReportMMEByDates"];
  const bupRxCuis = getBupRXCUIs(summaryData);
  if (isEmptyArray(bupRxCuis)) return [];
  return mmeList
    .filter((o) => bupRxCuis.find((item) => item === o.rxCUI))
    .map((o) => {
      return {
        Start: o.Start,
        End: o.End,
        rxNormCode: o.rxNormCode,
        rxCUI: o.rxNormCode.code,
        MMEValue: o.MMEValue,
      };
    });
}

export function GetNonBuprenorphineMMEListByDates(summaryData) {
  if (
    !summaryData ||
    !summaryData["RiskConsiderations"] ||
    !summaryData["RiskConsiderations"]["ReportMMEByDates"]
  )
    return [];
  if (isEmptyArray(summaryData["RiskConsiderations"]["ReportMMEByDates"]))
    return [];
  const mmeList = summaryData["RiskConsiderations"]["ReportMMEByDates"];
  const bupRxCuis = getBupRXCUIs(summaryData);
  if (isEmptyArray(bupRxCuis)) return mmeList ?? [];
  return mmeList
    .filter((o) => bupRxCuis.find((item) => item !== o.rxCUI))
    .map((o) => {
      return {
        Start: o.Start,
        End: o.End,
        rxNormCode: o.rxNormCode,
        rxCUI: o.rxNormCode.code,
        MMEValue: o.MMEValue,
      };
    });
}

export function ReportDailyMMEByDateWithoutBuprenorphine(summaryData) {
  if (isEmptyArray(GetBuprenorphineMMEListByDates(summaryData))) return [];
  if (isEmptyArray(GetNonBuprenorphineMMEListByDates(summaryData))) return [];
  const mmeList = summaryData["RiskConsiderations"]["ReportMMEByDates"];
  const bupRxcuis = getBupRXCUIs(summaryData);
  return mmeList.map((R) => {
    return {
      Start: R.Start,
      End: R.End,
      rxNormCode: R.rxNormCode,
      rxCUI: R.rxNormCode.code,
      //miniscule value for displaying on graph above x-axis
      MMEValue: bupRxcuis.find((rxcui) => rxcui === R.rxCUI)
        ? 0.000000001
        : R.MMEValue,
      category: "wo_buprenorphine",
    };
  });
}

export function ReportDailyMMEByDateWithBuprenorphineOnly(summaryData) {
  if (isEmptyArray(GetBuprenorphineMMEListByDates(summaryData))) return null;
  const mmeList = summaryData["RiskConsiderations"]["ReportMMEByDates"];
  const bupRxcuis = getBupRXCUIs(summaryData);
  return mmeList.map((R) => {
    return {
      Start: R.Start,
      End: R.End,
      rxNormCode: R.rxNormCode,
      rxCUI: R.rxNormCode.code,
      //miniscule value for displaying on graph above x-axis
      MMEValue: !bupRxcuis.find((rxcui) => rxcui === R.rxCUI)
        ? 0.000000001
        : R.MMEValue,
      category: "buprenorphine_onl",
    };
  });
}

export function getBupRXCUIs(summaryData) {
  if (
    !summaryData ||
    !summaryData["RiskConsiderations"] ||
    !summaryData["RiskConsiderations"]["ReportBuprenorphineMedicationRequests"]
  )
    return [];

  const bupMeds =
    summaryData["RiskConsiderations"]["ReportBuprenorphineMedicationRequests"];
  if (isEmptyArray(bupMeds)) return [];
  return bupMeds.flatMap((med) => {
    const medConcept = med.medication;
    const match = medConcept?.coding?.find(
      (item) =>
        item.system?.value === "http://www.nlm.nih.gov/research/umls/rxnorm"
    );
    if (!match) return [];
    return match.code?.value;
  });
}

export function getProcessedBupData(summaryData) {
  if (!summaryData) return null;
  if (!summaryData["RiskConsiderations"]) {
    summaryData["RiskConsiderations"] = {};
  }
  summaryData["RiskConsiderations"][
    "ReportDailyMMEByDateWithBuprenorphineOnly"
  ] = ReportDailyMMEByDateWithBuprenorphineOnly(summaryData);
  summaryData["RiskConsiderations"][
    "ReportDailyMMEByDateWithoutBuprenorphine"
  ] = ReportDailyMMEByDateWithoutBuprenorphine(summaryData);
  summaryData["MedicationRequestsForNaloxoneConsideration"] =
    MedicationRequestsForNaloxoneConsideration(summaryData);
  return summaryData;
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
