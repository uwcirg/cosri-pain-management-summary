import {
  isEmptyArray,
  removeDuplicatesFromArrayByProperty,
} from "../../helpers/utility";
import { BODY_DIAGRAM_DATA_KEY } from "../../config/report_config";
export function getSurveySummaryData(summaryData) {
  if (!summaryData) return null;
  if (summaryData.survey) return summaryData.survey;
  return null;
}
export function getReportSummaryData(summaryData) {
  if (!summaryData) return null;
  if (summaryData.report) return summaryData.report;
  return null;
}
export function getProcedureData(summaryData) {
  if (!summaryData || !summaryData.TreatmentHistory) return null;
  return summaryData.TreatmentHistory.Procedures;
}
export function getReferralData(summaryData) {
  if (!summaryData || !summaryData.TreatmentHistory) return null;
  return summaryData.TreatmentHistory.Referrals;
}
export function getMedicationListData(summaryData) {
  if (!summaryData) return null;
  if (summaryData.MedicationList) return summaryData.MedicationList;
  return null;
}
export function hasReportSummaryData(summaryData) {
  if (!summaryData) return false;
  let sectionData = [];
  const keys = Object.keys(summaryData);
  for (const key of keys) {
    if (!isEmptyArray(summaryData[key])) {
      sectionData = [...sectionData, ...summaryData[key]];
      continue;
    }
    const sectionKeys = Object.keys(summaryData[key]);
    for (const sectionKey of sectionKeys) {
      if (!isEmptyArray(summaryData[key][sectionKey])) {
        sectionData = [...sectionData, ...summaryData[key][sectionKey]];
      }
    }
  }
  return !isEmptyArray(sectionData);
}
export function hasSurveySummaryData(summaryData) {
  return ! (
    isEmptyArray(summaryData) ||
    summaryData.filter(
      (item) => item.ResponsesSummary && item.ResponsesSummary.length > 0
    ).length === 0
  );
}
export function getScoringData(summaryData) {
  return !isEmptyArray(summaryData)
    ? summaryData.filter((item) => !item.ExcludeFromScoring)
    : [];
}
export function getGraphData(summaryData) {
  if (isEmptyArray(summaryData)) return [];
  let data = [];
  summaryData.forEach((item) => {
    if (isEmptyArray(item.ResponsesSummary)) return true;
    if (item.ReportOnce) return true;
    data = [...data, ...item.ResponsesSummary];
  });
  return data;
}
export function getBodyDiagramData(summaryData) {
  if (isEmptyArray(summaryData)) return null;
  const matchedData = summaryData.filter(
    (item) =>
      String(item.QuestionnaireKey).toLowerCase() ===
      BODY_DIAGRAM_DATA_KEY.toLowerCase()
  );
  if (!matchedData.length) return null;
  let returnData = matchedData[0].ResponsesSummary;
  // date compared example: "2024-08-02T00:35:56+00:00"
  return removeDuplicatesFromArrayByProperty(returnData, "date");
}
