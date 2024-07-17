import { isEmptyArray } from "../../helpers/utility";
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
    (item) => String(item.dataKey).toLowerCase() === "paintracker-location-body-diagram"
  );
  if (!matchedData.length) return null;
  if (isEmptyArray(matchedData[0].ResponsesSummary)) return null;
  return matchedData[0].ResponsesSummary;
}
