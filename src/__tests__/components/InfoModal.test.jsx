import { render } from "@testing-library/react";
import InfoModal from "../../components/InfoModal";
import { mockSubSection } from "../../utils/testFixtures";

it("renders InfoModal without crashing", () => {
  const { container } = render(
    <InfoModal subSection={mockSubSection} closeModal={()=>{}}></InfoModal>
  );
  const infoModalElement = container.querySelector(".info-modal");
  expect(infoModalElement).toBeDefined();
});
