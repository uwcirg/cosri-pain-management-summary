import { shallowRender } from "../../../utils/testHelpers";
import { mockSurveySummaryData } from "../../../utils/testFixtures";
import { mockSurveySummaryNoData } from "../../../utils/testFixtures";
import ScoringSummary from "../../../components/report/components/ScoringSummary";

const component = shallowRender(ScoringSummary, {
  summary: mockSurveySummaryData,
});

it("renders without crashing", () => {
  expect(component).toExist();
});

it("renders the header with data", () => {
  expect(component.find(".table th")).toExist();
});

it("renders the body with data", () => {
  expect(component.find(".table .data-row")).toExist();
});

it("renders component without data without crashing", () => {
  const noDataComponent = shallowRender(ScoringSummary);
  expect(noDataComponent).toExist();
});

it("renders component without data - no header", () => {
  const noDataComponent = shallowRender(ScoringSummary);
  expect(noDataComponent.find(".table .no-data-row")).toExist();
});

it("renders component without data - no data row", () => {
  const noDataComponent = shallowRender(ScoringSummary);
  expect(noDataComponent.find(".table th")).toHaveLength(0);
});

it("renders component without responses", () => {
  const noDataComponent = shallowRender(ScoringSummary, {
    summary: mockSurveySummaryNoData
  });
  expect(noDataComponent.find(".table .no-data-row")).toExist();
});
