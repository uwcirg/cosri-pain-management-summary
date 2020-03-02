import { shallowRender } from '../../utils/testHelpers';
import VideoLink from '../../components/VideoLink';

const component = shallowRender(VideoLink, {
    title: 'Test Video',
    src: 'https://www.youtube.com/embed/CF64WEju1pM',
    className: 'video',
    toggleable: true
});

it('renders without crashing', () => {
  expect(component).toExist();
});
