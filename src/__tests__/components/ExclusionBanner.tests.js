import { shallowRender } from '../../utils/testHelpers';
import ExclusionBanner from '../../components/ExclusionBanner';

const component = shallowRender(ExclusionBanner, {
  url: 'testUrl',
  query: {}
});

it('renders without crashing', () => {
  expect(component).toExist();
});

it('closes the banner when the button is clicked', () => {
  expect(component.find('.exclusion-banner').hasClass('close')).toBe(true);
  component.simulate('click');
  expect(component.find('.exclusion-banner').hasClass('close')).toBe(false);
});
