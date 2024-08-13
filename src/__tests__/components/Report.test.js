import { render } from "@testing-library/react";
import Report from "../../components/Report";
import { mockSurveySummaryData } from "../../utils/testFixtures";

let spy;
beforeAll(() => {
  // This test logs an ugly error because FHIR is not initialized (as expected).
  // Since we expect this error, we suppress console.error here
  spy = jest.spyOn(global.console, "error").mockImplementation(() => jest.fn());
});
afterAll(() => spy.mockRestore());

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
