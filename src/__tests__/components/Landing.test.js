import { shallowRender } from '../../utils/testHelpers';
import Landing from '../../components/Landing';

let spy;

Promise.allSettled = function (promises) {
  let mappedPromises = promises.map((p) => {
    return p
      .then((value) => {
        return {
          status: 'fulfilled',
          value,
        };
      })
      .catch((reason) => {
        return {
          status: 'rejected',
          reason,
        };
      });
  });
  return Promise.all(mappedPromises);
};
beforeAll(() => {
  // This test logs an ugly error because FHIR is not initialized (as expected).
  // Since we expect this error, we suppress console.error here
  spy = jest.spyOn(global.console, 'error').mockImplementation(() => jest.fn());
});
afterAll(() => spy.mockRestore());

it('renders without crashing', () => {
  const component = shallowRender(Landing, {});
  expect(component).toExist();
});

