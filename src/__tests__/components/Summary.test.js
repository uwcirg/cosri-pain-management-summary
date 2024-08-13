import { render } from "@testing-library/react"
import { mockSummaryA, mockSectionFlags } from '../../utils/testFixtures';
import Summary from '../../components/Summary';
import summaryMap from '../../config/summary_config.json';

it('renders Summary without crashing', () => {
  const { container } = render(
    <Summary
      {...{
        summary: mockSummaryA,
        sectionFlags: mockSectionFlags,
        collector: [],
        result: {},
        summaryMap: summaryMap
      }}
    ></Summary>
  );
  const summaryElement = container.querySelector(".summary");
  expect(summaryElement).toBeDefined();
});

it('renders the scrolling nav', () => {
  const { container } = render(
    <Summary
      {...{
        summary: mockSummaryA,
        sectionFlags: mockSectionFlags,
        collector: [],
        result: {},
        summaryMap: summaryMap
      }}
    ></Summary>
  );
  expect(container.querySelector(".summary__nav")).toBeDefined();
});

it('renders the summary display', () => {
  const { container } = render(
    <Summary
      {...{
        summary: mockSummaryA,
        sectionFlags: mockSectionFlags,
        collector: [],
        result: {},
        summaryMap: summaryMap
      }}
    ></Summary>
  );
  expect(container.querySelector(".summary__display")).toBeDefined();
});

it.skip('renders all subsection headers', () => {
  const { container } = render(
    <Summary
      {...{
        summary: mockSummaryA,
        sectionFlags: mockSectionFlags,
        collector: [],
        result: {},
        summaryMap: summaryMap
      }}
    ></Summary>
  );
  // TODO figure out why this isn't working
  const subSectionLength = container.querySelectorAll(".sub-section__header").length;
  expect(subSectionLength).ToBe(17);
});

// TODO: Fix this test (it broke when React-Table was introduced)
it.skip('renders conditions and encounter diagnoses in separate tables', () => {
  const { container } = render(
    <Summary
      {...{
        summary: mockSummaryA,
        sectionFlags: mockSectionFlags,
        collector: [],
        result: {},
        summaryMap: summaryMap
      }}
    ></Summary>
  );
  const tables = container.querySelectorAll(
    "#RiskFactorsForOpioidRelatedHarms ~ .table > ReactTable"
  );
  expect(tables.length).toBe(2);
  // This is the point where things go wrong.  Below I've done what I thought would work (but it doesn't).
  // const conditionTable = tables.at(0).shallow();
  // expect(conditionTable.find('.rt-tr-group')).toHaveLength(1);
  // expect(conditionTable.at(0).find('.rt-td').at(1)).toHaveText('Agoraphobia with panic attacks (disorder)');
  // expect(conditionTable.at(1).find('.rt-tr-group')).toHaveLength(1);
  // expect(conditionTable.at(1).find('.rt-td').at(1)).toHaveText('Suicide attempt, initial encounter');
});
