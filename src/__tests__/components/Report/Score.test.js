import { shallowRender } from "../../../utils/testHelpers";
import Score from "../../../components/Report/components/Score";

it("renders the score with high severity", () => {
    const component = shallowRender(Score, {
      score: 1,
      scoreParams: {
        scoreSeverity: "high",
      },
    });
  expect(component.find(".text-alert")).toExist();
});

it("renders the score without severity", () => {
  const component = shallowRender(Score, {
    score: 1
  });
  expect(component.find(".text-alert")).toHaveLength(0);
});

it("renders without params without crashing", () => {
  const component = shallowRender(Score);
  expect(component).toExist();
});

