import { dateFormat } from "../../helpers/formatit";
import {
  addMonthsToDate,
  getDateObjectInLocalDateTime,
  getDisplayDateFromISOString,
  getDiffDays,
  getDiffMonths,
  getHighRiskMMEThreshold,
  isEmptyArray,
  deleteFHIRResourcesByType,
  getArrayOfDatesFromToday,
} from "../../helpers/utility";

export const HIGH_RISK_MME_THRESHOLD = getHighRiskMMEThreshold();
export const COSRI_ALERTS_SYSTEM_URI = "https://cosri.app/alerts";
export const HIGH_RISK_MME_ALERT_TYPE = "highRiskMME";
export const NALOXONE_ALERT_TYPE = "naloxone";
export const COUNSELING_ALERT_TYPE = "counseling";

export const alertProps = {
  [NALOXONE_ALERT_TYPE]: {
    foldedTitle: "Naloxone - any dose",
    expandedTitle:
      "Naloxone is recommended for every patient receiving opioids. Please verify access annually.",
    foldedText: "Access never verified. Click here.",
    expandedText_aboutdue:
      "This alert should be acknowledged by {date}.  Please verify access and acknowledge.",
    expandedText_due: "Please verify access and acknowledge this alert.",
    expandedText_acknowledged:
      "This alert should next be acknowledged after {date}.",
    alertConceptCode: "cosri_naloxone_alert",
    acknowledgedConceptCode: "cosri_naloxone_alert_acknowledgement",
    codeSystem: COSRI_ALERTS_SYSTEM_URI,
  },
  [HIGH_RISK_MME_ALERT_TYPE]: {
    foldedTitle: `Naloxone ≥ ${HIGH_RISK_MME_THRESHOLD} MME`,
    expandedTitle: `Patient's MME is greater than ${HIGH_RISK_MME_THRESHOLD} so higher risk of overdose. Please verify naloxone access.`,
    foldedText: "Access never verified. Click here.",
    expandedText_aboutdue:
      "This alert should be acknowledged by {date}.  Please verify access and acknowledge.",
    expandedText_due: "Please verify access and acknowledge this alert.",
    expandedText_acknowledged:
      "This alert should next be acknowledged after {date}.",
    alertConceptCode: "cosri_high_risk_mme_alert",
    acknowledgedConceptCode: "cosri_high_risk_mme_alert_acknowledgement",
    codeSystem: COSRI_ALERTS_SYSTEM_URI,
  },
  [COUNSELING_ALERT_TYPE]: {
    foldedTitle: "Naloxone recommendation",
    expandedTitle:
      "Naloxone is recommended for every patient receiving opioids.  Consider counseling.",
    expandedTitle_acknowledged:
      "Naloxone is recommended for every patient receiving opioids.  Counseled in past.",
    foldedText: "No opioids currently dispensed. Click here if counseling.",
    expandedText_due: "Click here if Naloxone access verified, for any reason.",
    alertConceptCode: "cosri_naloxone_counseling_alert",
    acknowledgedConceptCode: "cosri_naloxone_counseling_alert_acknowledgement",
    codeSystem: COSRI_ALERTS_SYSTEM_URI,
  },
};

export const getAlertType = (summaryData) => {
  if (hasHighRiskMME(summaryData)) return HIGH_RISK_MME_ALERT_TYPE;
  if (hasActiveOpioidMed(summaryData)) return NALOXONE_ALERT_TYPE;
  return COUNSELING_ALERT_TYPE;
};

export const shouldDisplayAlert = (alertType, summaryData) => {
  if (alertType === HIGH_RISK_MME_ALERT_TYPE) {
    return hasHighRiskMME(summaryData);
  }
  if (alertType === NALOXONE_ALERT_TYPE) return hasActiveOpioidMed(summaryData);
  return false;
};
export function hasMMEData(summaryData) {
  return (
    !isEmptyArray(summaryData) && summaryData.find((item) => item.MMEValue > 0)
  );
}
export const getDisplayDate = (date) =>
  date
    ? getDisplayDateFromISOString(date, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
export function getTodayDateString() {
  const hoy = new Date();
  const month = hoy.getMonth() + 1;
  const pad = function (n) {
    n = parseInt(n);
    return n < 10 ? "0" + n : n;
  };
  const hoyDate =
    hoy.getFullYear() + "-" + pad(month) + "-" + pad(hoy.getDate());
  return hoyDate;
}
export function hasActiveOpioidMed(summaryData) {
  return (
    hasMMEData(summaryData) &&
    summaryData.find((item) => {
      const daysDiff = getDiffDays(
        getDateObjectInLocalDateTime(item.date),
        new Date()
      );
      return daysDiff >= 0 && daysDiff <= 1;
    })
  );
}

export function getFirstIndexOfNormalMME(summaryData) {
  if (isEmptyArray(summaryData)) return -1;
  const riskThreshold = getHighRiskMMEThreshold();
  return summaryData.findIndex((item) => item.MMEValue < riskThreshold);
}

export function getFirstIndexOfHighRiskMME(summaryData) {
  if (isEmptyArray(summaryData)) return -1;
  const riskThreshold = getHighRiskMMEThreshold();
  return summaryData.findIndex((item) => item.MMEValue >= riskThreshold);
}

export function hasHighRiskMME(summaryData) {
  if (!hasMMEData(summaryData)) return false;
  const targetData = summaryData.filter((item) => {
    const itemDate = getDateObjectInLocalDateTime(item.date);
    const daysDiff = getDiffDays(itemDate, new Date());
    return daysDiff >= 0 && daysDiff <= 1;
  });
  return targetData.find((item) => item.MMEValue >= getHighRiskMMEThreshold());
  // const normalMMEIndex = getFirstIndexOfNormalMME(targetData);
  // const highRiskMMEIndex = getFirstIndexOfHighRiskMME(targetData);
  // console.log("normal mme index ", normalMMEIndex);
  // console.log("high risk mme index ", highRiskMMEIndex);
  // if (normalMMEIndex === -1) return highRiskMMEIndex >= 0;
  // return normalMMEIndex <= highRiskMMEIndex;
}

export const getMostRecentCommunicationBySentFromBundle = (bundle) => {
  return bundle && !isEmptyArray(bundle.entry)
    ? bundle.entry
        .sort((a, b) => new Date(b.resource.sent) - new Date(a.resource.sent))
        .map((item) => item.resource)[0]
    : null;
};

export const getMostRecentCommunicationRequestByEndDateFromBundle = (
  bundle,
  excludeIds = []
) => {
  const IdsToExclude = !isEmptyArray(excludeIds) ? excludeIds : [];
  return bundle && !isEmptyArray(bundle.entry, excludeIds)
    ? bundle.entry
        .filter((item) => IdsToExclude.indexOf(item.resource.id) === -1)
        .sort(
          (a, b) =>
            new Date(b.resource.occurrencePeriod?.end) -
            new Date(a.resource.occurrencePeriod?.end)
        )
        .map((item) => item.resource)[0]
    : null;
};

export const getCommunicationPayload = (params = {}, crId) => {
  const {
    patient,
    noteText,
    sentDate,
    acknowledgedConceptCode,
    codeSystem,
    foldedTitle,
    id,
  } = params;
  return {
    resourceType: "Communication",
    id: id ? id : null,
    category: [
      {
        coding: [
          {
            code: `${acknowledgedConceptCode}`,
            system: `${codeSystem}`,
          },
        ],
      },
    ],
    payload: [
      {
        contentString: `${foldedTitle} alert acknowledgement`,
      },
    ],
    note: noteText ? [{ text: noteText }] : null,
    sent: sentDate ? sentDate : new Date().toISOString(),
    basedOn: crId
      ? [
          {
            reference: "CommunicationRequest/" + crId,
          },
        ]
      : null,
    subject: {
      reference: `Patient/${patient?.id}`,
    },
    status: "completed",
  };
};

export const getCommunicationRequestPayload = (params = {}) => {
  const {
    patient,
    alertConceptCode,
    codeSystem,
    text,
    id,
    startDate,
    endDate,
    status,
    noteText,
  } = params;
  return {
    resourceType: "CommunicationRequest",
    id: id ? id : null,
    category: [
      {
        coding: [
          {
            code: `${alertConceptCode}`,
            system: `${codeSystem}`,
          },
        ],
      },
    ],
    payload: [
      {
        contentString: text,
      },
    ],
    occurrencePeriod: {
      start: startDate ? startDate : new Date().toISOString(),
      end: endDate ? endDate : addMonthsToDate(null, 12),
    },
    note: noteText ? [{ text: noteText }] : null,
    subject: {
      reference: `Patient/${patient?.id}`,
    },
    status: status ? status : "active",
  };
};

export function getSentDateFromCommunication(item) {
  if (!item) return null;
  if (item.resource) return item.resource.sent;
  return item.sent;
}

export function getReferencedCRIdsFromBundle(bundle) {
  return bundle && !isEmptyArray(bundle.entry)
    ? bundle.entry.map((item) =>
        getReferencedCommunicationRequestId(item.resource)
      )
    : null;
}
export function getReferencedCommunicationRequestId(communication) {
  if (!communication) return null;
  if (isEmptyArray(communication.basedOn)) return null;
  return communication.basedOn[0].reference?.split("/").slice(-1)[0];
}

export function getEndDateFromCommunicationRequest(item) {
  if (!item) return null;
  if (item.resource) return item.resource.occurrencePeriod?.end;
  return item.occurrencePeriod?.end;
}

export function isOverDue(dateString) {
  if (!dateString) return false;
  const diffMonths = getDiffMonths(
    getDateObjectInLocalDateTime(dateString),
    new Date()
  );
  return diffMonths > 12;
}

export function isAboutDue(dateString) {
  if (!dateString) return false;
  const diffMonths = getDiffMonths(
    getDateObjectInLocalDateTime(dateString),
    new Date()
  );
  return diffMonths > 10 && diffMonths <= 12;
}

export function isNotDueYet(dateString) {
  if (!dateString) return false;
  const diffMonths = getDiffMonths(
    getDateObjectInLocalDateTime(dateString),
    new Date()
  );
  return diffMonths >= 0 && diffMonths <= 10;
}

export async function removeAllResources(client, patientId) {
  return new Promise((resolve, reject) => {
    Promise.allSettled([
      deleteFHIRResourcesByType("Communication", client, patientId),
      deleteFHIRResourcesByType("CommunicationRequest", client, patientId),
    ])
      .then((results) => {
        if (results[0].status === "rejected") {
          reject(
            "Unable to remove all Communication resources. See console for detail."
          );
          return;
        }
        if (results[1].status === "rejected") {
          reject(
            "Unable to remove all CommunicationRequest resources. See console for detail."
          );
          return;
        }
        resolve(results);
      })
      .catch((e) => reject(e));
  });
}

export async function createComms(client, params = {}, crId, cId) {
  if (!client) return;
  const communicationRequestPayLoad = getCommunicationRequestPayload({
    ...params,
    id: crId,
  });
  const crMethod = crId ? "update" : "create";
  return new Promise((resolve, reject) => {
    client[crMethod](communicationRequestPayLoad)
      .then((result) => {
        console.log("communicationRequest created ", result);
        if (result && result.id) {
          const cMethod = cId ? "update" : "create";
          const communicationPayload = getCommunicationPayload(
            {
              ...params,
              id: cId,
            },
            result.id
          );
          client[cMethod](communicationPayload)
            .then((result) => {
              console.log("Communication created result ", result);
              if (result && result.id) {
                resolve(result);
              } else reject("Unable to create Communication resource.");
            })
            .catch((e) => reject(e));
        } else {
          reject("Unable to create CommunicationRequest resource.");
        }
      })
      .catch((e) => reject(e));
  });
}

export async function resetComms(client, patientId, params, crId, cId) {
  return new Promise((resolve, reject) => {
    Promise.allSettled([createComms(client, params, crId, cId)])
      .then((results) => {
        if (results[0].status === "rejected") {
          reject("Error creating resources.");
          return;
        }
        resolve(results);
      })
      .catch((e) => reject(e));
  });
}

export function getDebugMMEData() {
  const urlParams = new URLSearchParams(window.location.search);
  const debugValue = urlParams.get("mmeValue") ?? 0;
  return getArrayOfDatesFromToday(5).map((item) => ({
    date: dateFormat("", item, "YYYY-MM-DD"),
    MMEValue: debugValue,
  }));
}
