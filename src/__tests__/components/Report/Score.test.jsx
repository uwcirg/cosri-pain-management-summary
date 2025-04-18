import { render } from "@testing-library/react";
import Score from "../../../components/Report/components/Score";

it("renders the score with high severity", () => {
  const { container } = render(
    <Score
      score={1}
      scoreParams={{
        scoreSeverity: "high",
      }}
    ></Score>
  );
  const alertElement = container.querySelector(".text-alert");
  expect(alertElement).toBeDefined();
});

it("renders the score without severity", () => {
  const { container } = render(<Score score={1}></Score>);
  const alertElement = container.querySelector(".text-alert");
  expect(alertElement).toBeNull();
});

it("renders without params without crashing", () => {
  const { container } = render(<Score score={1}></Score>);
  const scoreElement = container.querySelector(".score");
  expect(scoreElement).toBeDefined();
});
