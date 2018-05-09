import { shallowRender } from '../../utils/testHelpers';
import { mockSummaryA, mockSectionFlags } from '../../utils/testFixtures';
import Summary from '../../components/Summary';

const component = shallowRender(Summary, {
  summary: mockSummaryA,
  sectionFlags: mockSectionFlags,
  collector: [],
  result: {},
  numMedicalHistoryEntries: 2,
  numPainEntries: 4,
  numTreatmentsEntries: 1,
  numRiskEntries: 2
});

it('renders without crashing', () => {
  expect(component).toExist();
});

it('renders the scrolling nav', () => {
  expect(component.find('.summary__nav')).toExist();
});

it('renders the summary display', () => {
  expect(component.find('.summary__display')).toExist();
});

it('renders all subsection headers', () => {
  expect(component.find('.sub-section__header')).toHaveLength(14);
});
