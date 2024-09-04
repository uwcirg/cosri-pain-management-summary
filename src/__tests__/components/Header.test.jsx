import { render } from "@testing-library/react";
import { mockSummaryA } from "../../utils/testFixtures";
import Header from "../../components/Header";

const paramObj = {
  patientName: mockSummaryA.Patient.Name,
  // patientAge: mockSummaryA.Patient.Age,
  patientGender: mockSummaryA.Patient.Gender,
  patientDOB: "1950-01-05",
  totalEntries: 21,
  numFlaggedEntries: 0,
  meetsInclusionCriteria: true,
};


it("renders Header without crashing", () => {
  const { container } = render(
    <Header
      {...paramObj}
    ></Header>
  );
  const headerElement = container.querySelector(".header");
  expect(headerElement).toBeDefined();
});

it("renders the patient name, age, dob, and gender", () => {
  const { container } = render(<Header {...paramObj}></Header>);
  const patientName = container.querySelector(".patient-name").textContent;
  console.log(patientName)
  expect(patientName).toBe(
    mockSummaryA.Patient.Name
  );
  /*
   * note currently not displaying age anymore
   */
  // expect(component.find('.patient-age')).toHaveText(`${mockSummaryA.Patient.Age} YRS`);
  const patientGender = container.querySelector(".patient-gender").textContent;
  expect(patientGender).toBe(
    mockSummaryA.Patient.Gender
  );
  const patientDob = container.querySelector(".patient-dob").textContent;
  expect(patientDob).toBe("DOB: 1950-01-05");
});

//skip this test as total entries aren't being displayed anymore
// it('renders the total number of entries', () => {
//   expect(component.find('.total')).toHaveText('21');
// });
