import { render, act } from "@testing-library/react";
import ExclusionBanner from "../../components/ExclusionBanner";

it("renders ExclusionBanner without crashing", () => {
  const { container } = render(
    <ExclusionBanner
      {...{
        url: "testUrl",
        query: {},
      }}
    ></ExclusionBanner>
  );
  const bannerElement = container.querySelector(".exclusion-banner");
  expect(bannerElement).toBeDefined();
});

it("closes the banner when the button is clicked", () => {
  const { container } = render(
    <ExclusionBanner
      {...{
        url: "testUrl",
        query: {},
      }}
    ></ExclusionBanner>
  );
  const bannerElement = container.querySelector(".exclusion-banner");
  expect(bannerElement.classList.contains("close")).toBe(false);
  act(() => bannerElement.click());
  expect(bannerElement.classList.contains("close")).toBe(true);
});
