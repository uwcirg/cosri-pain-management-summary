import { render } from "@testing-library/react";
import FhirQuery from '../../components/FhirQuery';

const {container} = render(<FhirQuery {...{
  url: 'testUrl',
  data: {}
}}></FhirQuery>);

it('renders FhirQuery without crashing', () => {
  expect(container.querySelector(".fhir-query")).toBeDefined();
});
