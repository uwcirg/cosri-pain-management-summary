import "@testing-library/jest-dom";
import { render} from "@testing-library/react";
import { currentDateTimeFormat } from "../../helpers/formatit";
import DataInfo from "../../components/DataInfo";

it("renders DataInfo without crashing", () => {
  const {container} = render(<DataInfo
    contentText="content is blank"
    queryDateTime={currentDateTimeFormat()}></DataInfo>
  );
  const dataInfoElement = container.querySelector(".data-provenance");
  expect(dataInfoElement).toBeInTheDocument();
});
