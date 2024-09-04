import { render } from "@testing-library/react";
import SideNav from "../../components/SideNav";

it("renders the scrolling nav", () => {
  const { container } = render(
    <SideNav
    ></SideNav>
  );
  expect(container.querySelector(".summary__nav")).toBeDefined();
});
