import {
  addMonthsToDate,
  getDateObjectInLocalDateTime,
  getDiffDays,
  getDiffMonths,
  getHighRiskMMEThreshold,
  isEmptyArray,
} from "../../helpers/utility";

export const HIGH_RISK_MME_THRESHOLD = getHighRiskMMEThreshold();
export const COSRI_ALERTS_SYSTEM_URI = "https://cosri.app/alerts";
export const alertProps = {
  naloxone: {
    title: "Naloxone - all patients",
    text: "Naloxone is recommended for every patient receiving opioids. Please verify access annually.",
    alertConceptCode: "cosri_naloxone_alert",
    acknowledgedConceptCode: "cosri_naloxone_alert_acknowledgement",
    codeSystem: COSRI_ALERTS_SYSTEM_URI,
  },
  highRiskMME: {
    title: `Naloxone ≥ ${HIGH_RISK_MME_THRESHOLD} MME`,
    text: `Patient's MME is greater than ${HIGH_RISK_MME_THRESHOLD} so higher risk of overdose. Please verify naloxone access.`,
    alertConceptCode: "cosri_high_risk_mme_alert",
    acknowledgedConceptCode: "cosri_high_risk_mme_alert_acknowledgement",
    codeSystem: COSRI_ALERTS_SYSTEM_URI,
  },
};

export function shouldDisplayAlert(alertType, summaryData) {
  if (alertType === "highRiskMME") {
    return hasHighRiskMME(summaryData);
  }
  return hasActiveOpioidMed(summaryData);
}
export function hasMMEData(summaryData) {
  return (
    !isEmptyArray(summaryData) && summaryData.find((item) => item.MMEValue > 0)
  );
}
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

export const getCommunicationPayload = (params = {}, crId) => {
  const { patient, userId, acknowledgedConceptCode, codeSystem, title, id } =
    params;
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
        contentString: `${title} alert acknowledgement`,
      },
    ],
    note: userId ? [{ text: " acknowledged by " + userId }] : null,
    sent: new Date().toISOString(),
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

export function getReferencedCommunicationRequest(communication) {
  if (!communication) return null;
  if (isEmptyArray(communication.basedOn)) return null;
  return communication.basedOn[0].reference;
}

export function getEndDateFromCommunicationRequest(item) {
  if (!item) return false;
  if (item.resource) return item.resource.occurrencePeriod?.end;
  return item.occurrencePeriod?.end;
}


export function isOverDue(dateString) {
  if (!dateString) return false;
  return (
    getDiffMonths(getDateObjectInLocalDateTime(dateString), new Date()) > 12
  );
}

export function isAboutDue(dateString) {
  if (!dateString) return false;
  const diffMonths = getDiffMonths(
    getDateObjectInLocalDateTime(dateString),
    new Date()
  );
  console.log("date ", dateString, " diff ", diffMonths)
  return diffMonths >= 10 && diffMonths <= 12;
}
