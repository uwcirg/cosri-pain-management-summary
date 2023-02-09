import {render} from "@testing-library/react"
import Video from '../../components/Video';

const {container} = render(<Video {...{
    title: 'Test Video',
    src: 'https://www.youtube.com/embed/CF64WEju1pM',
    toggleable: true
}}></Video>);

it('renders Video without crashing', () => {
  expect(container.querySelector(".video-link")).toBeDefined();
});
