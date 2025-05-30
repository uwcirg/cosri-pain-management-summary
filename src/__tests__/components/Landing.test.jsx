// import { render } from "@testing-library/react";
// import Landing from '../../components/Landing';

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
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
});
afterAll(() => spy.mockRestore());
it.skip('renders Landing without crashing', () => {
  // const {container} = render(Landing, {});
  // expect(container.querySelector(".landing")).toBeDefined();
  // TODO figure out how to avoid FHIR client error
});

