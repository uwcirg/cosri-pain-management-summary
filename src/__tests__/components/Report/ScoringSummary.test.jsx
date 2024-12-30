import { render } from "@testing-library/react";
import { mockSurveySummaryData } from "../../../utils/testFixtures";
import { mockSurveySummaryNoData } from "../../../utils/testFixtures";
import ScoringSummary from "../../../components/Report/components/ScoringSummary";

const {container} = render(<ScoringSummary
  summary={mockSurveySummaryData}
></ScoringSummary>);

it("renders without crashing", () => {
  const tableElement = container.querySelector(".score-summary-table")
  expect(tableElement).toBeDefined();
});

it("renders the header with data", () => {
  expect(container.querySelector(".table th")).toBeDefined();
});

it("renders the body with data", () => {
  expect(container.querySelector(".table .data-row")).toBeDefined();
});

it("renders component without data without crashing", () => {
  const {container} = render(<ScoringSummary></ScoringSummary>);
  expect(container.querySelector(".score-summary-table")).toBeDefined();
});

it("renders component without data - no header", () => {
  const {container} = render(<ScoringSummary></ScoringSummary>);
  expect(container.querySelector(".table .no-data-row")).toBeDefined();
});

it("renders component without data - no data row", () => {
  const {container} = render(<ScoringSummary></ScoringSummary>);
  expect(container.querySelector(".table th")).toBeNull();
});

it("renders component without responses", () => {
  const {container} = render(<ScoringSummary
    summary = {mockSurveySummaryNoData}
  ></ScoringSummary>);
  expect(container.querySelector(".table .no-data-row")).toBeDefined();
});
