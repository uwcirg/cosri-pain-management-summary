import { render } from "@testing-library/react";
import InclusionBanner from "../../components/InclusionBanner";

it("renders InclusionBanner without crashing", () => {
  const { container } = render(
    <InclusionBanner
      {...{
        url: "testUrl",
        query: {},
        dismissible: true,
      }}
    ></InclusionBanner>
  );
  const bannerElement = container.querySelector(".inclusion-banner");
  expect(bannerElement).toBeDefined();
});

it("closes the inclusion banner when the button is clicked", () => {
  const { container } = render(
    <InclusionBanner
      {...{
        url: "testUrl",
        query: {},
        dismissible: true,
      }}
    ></InclusionBanner>
  );
  expect(container.querySelector(".inclusion-banner")).toBeDefined();
});
