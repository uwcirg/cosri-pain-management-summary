import { shallowRender } from '../../utils/testHelpers';
import Video from '../../components/Video';

const component = shallowRender(Video, {
    title: 'Test Video',
    src: 'https://www.youtube.com/embed/CF64WEju1pM',
    className: 'video',
    toggleable: true
});

it('renders without crashing', () => {
  expect(component).toExist();
});
