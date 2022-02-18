import {sumArray, daysFromToday, getDiffMonths, getDiffDays, isDateInPast} from '../../helpers/utility';

it('sum array correctly', () => {
  const mockArray = [1, 2, 3, 4, 5];
  expect(sumArray(mockArray)).toEqual(15);
});

it('compute day difference from today correctly', () => {
  expect(daysFromToday('2022-02-12')).toBeGreaterThanOrEqual(3);
});

it('compute day difference correctly', () => {
  expect(getDiffDays('2022-02-12', '2022-02-14')).toEqual(2);
});

it('compute month difference correctly', () => {
  expect(getDiffMonths('2022-02-12', '2022-03-14')).toBeGreaterThanOrEqual(1);
});

it('compute date in past correctly', () => {
  expect(isDateInPast(new Date('2022-02-12'), new Date())).toBe(true);
});
