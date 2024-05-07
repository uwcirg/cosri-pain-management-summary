export function hasNoSummaryData(summaryData) {
  return (
    !summaryData ||
    !summaryData.length ||
    summaryData.filter(
      (item) => item.ResponsesSummary && item.ResponsesSummary.length > 0
    ).length === 0
  );
}
export function getScoringData(summaryData) {
  return summaryData && Array.isArray(summaryData)
    ? summaryData.filter((item) => !item.ExcludeFromScoring)
    : [];
}
export function getGraphData(summaryData) {
  if (!summaryData || !Array.isArray(summaryData)) return [];
  let data = [];
  summaryData.forEach((item) => {
    if (!item.ResponsesSummary || !item.ResponsesSummary.length) return true;
    if (item.ReportOnce) return true;
    data = [...data, ...item.ResponsesSummary];
  });
  return data;
}
export function getBodyDiagramDataSummaryData(summaryData) {
  if (!summaryData || !Array.isArray(summaryData)) return null;
  const matchedData = summaryData.filter(
    (item) => String(item.dataKey).toLowerCase() === "body_diagram"
  );
  if (!matchedData.length) return null;
  if (
    !matchedData[0].ResponsesSummary ||
    !Array.isArray(matchedData[0].ResponsesSummary) ||
    !matchedData[0].ResponsesSummary.length
  )
    return null;
  return matchedData[0].ResponsesSummary;
}
