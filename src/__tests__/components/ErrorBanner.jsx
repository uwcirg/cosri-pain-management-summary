import { render } from "@testing-library/react";
import ErrorBanner from "../../components/ErrorBanner";

it("renders ErrorBanner without crashing", () => {
  const { container } = render(
    <ErrorBanner
    errors={["this is to test error banner"]}
    ></ErrorBanner>
  );
  const bannerElement = container.querySelector(".error-banner");
  expect(bannerElement).toBeDefined();
});
