import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import Report from "../../components/Report";
import { mockSurveySummaryData } from "../../utils/testFixtures";

it("renders without summary data without crashing", () => {
  const { container } = render(<Report></Report>);
  expect(container.querySelector(".report")).toBeDefined();
});

it("renders with summary data without crashing", () => {
  const { container } = render(
    <Report summary={mockSurveySummaryData}></Report>
  );
  expect(container.querySelector(".report")).toBeDefined();
});
