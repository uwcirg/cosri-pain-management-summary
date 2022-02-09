import { shallowRender } from '../../utils/testHelpers';
import Warning from '../../components/Warning';

const component = shallowRender(Warning);

it('renders without crashing', () => {
  expect(component).toExist();
});
