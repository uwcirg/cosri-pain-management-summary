import { render } from "@testing-library/react"
import Warning from '../../components/Warning';

const {container} = render(<Warning></Warning>);

it('renders Warning without crashing', () => {
  expect(container.querySelector(".warning")).toBeDefined();
});
