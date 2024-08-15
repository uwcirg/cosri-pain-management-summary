import { shallowRender } from "../../utils/testHelpers";
import SideNav from "../../components/SideNav";

it("renders the scrolling nav", () => {
  const component = shallowRender(SideNav);
  expect(component.find(".summary__nav")).toExist();
});
