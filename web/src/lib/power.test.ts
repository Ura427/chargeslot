import { speedTier } from './power';

describe('speedTier', () => {
  it.each([
    [7, 'Slow'],
    [22, 'Slow'],
    [23, 'Fast'],
    [50, 'Fast'],
    [51, 'Ultra-fast'],
    [350, 'Ultra-fast'],
  ])('%i kW is %s', (kw, label) => {
    expect(speedTier(kw).label).toBe(label);
  });
});
