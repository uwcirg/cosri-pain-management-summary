import { shallowRender } from '../../utils/testHelpers';
import SystemBanner from '../../components/SystemBanner';

const component = shallowRender(SystemBanner);

it('renders without crashing', () => {
  expect(component).toExist();
});
