import { render } from "@testing-library/react";
import SystemBanner from '../../components/SystemBanner';



it('renders SystemBanner (development) without crashing', () => {
  const { container } = render(
    <SystemBanner
      {...{
        type: "development",
      }}
    ></SystemBanner>
  );
  expect(container.querySelector(".system-banner")).toBeDefined();
});
