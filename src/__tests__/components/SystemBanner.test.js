import { shallowRender } from '../../utils/testHelpers';
import SystemBanner from '../../components/SystemBanner';

const component = shallowRender(SystemBanner, {
  type: "development"
});

it('renders without crashing', () => {
  expect(component).toExist();
});
