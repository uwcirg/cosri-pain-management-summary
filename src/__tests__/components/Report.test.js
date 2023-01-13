import { shallowRender } from "../../utils/testHelpers";
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
  const component = shallowRender(Report);
  expect(component).toExist();
});

it("renders with summary data without crashing", () => {
  const component = shallowRender(Report, {
    summary: mockSurveySummaryData
  });
  expect(component).toExist();
});