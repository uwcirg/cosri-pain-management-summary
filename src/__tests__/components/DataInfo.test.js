import { shallowRender } from '../../utils/testHelpers';
import { currentDateTimeFormat } from '../../helpers/formatit';
import DataInfo from '../../components/DataInfo';

const component = shallowRender(DataInfo, {
    contentText: 'content is blank',
    queryDateTime: currentDateTimeFormat()
});

it('renders without crashing', () => {
  expect(component).toExist();
});
