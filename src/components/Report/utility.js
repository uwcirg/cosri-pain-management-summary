import { isEmptyArray } from "../../helpers/utility";
import { BODY_DIAGRAM_DATA_KEY } from "../../config/report_config";
export function hasNoSummaryData(summaryData) {
  return (
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
    (item) => String(item.QuestionnaireKey).toLowerCase() === BODY_DIAGRAM_DATA_KEY.toLowerCase()
  );
  if (!matchedData.length) return null;
  if (isEmptyArray(matchedData[0].ResponsesSummary)) return null;
  return matchedData[0].ResponsesSummary;
}
