import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import DevTools from "../../components/DevTools";

it("renders DevTool without crashing", () => {
  const { container } = render(
    <DevTools
      collector={[]}
      result={{}}
      summary={{}}
    ></DevTools>
  );
  const devToolElement = container.querySelector(".dev-tools");
  expect(devToolElement).toBeInTheDocument();
});
