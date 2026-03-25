import PieceBag from '../../models/PieceBag.js';
import { COLOR } from '../../models/constants.js';
import seedrandom from 'seedrandom';

describe('PieceBag', () => {
  let bag;

  beforeEach(() => {
    bag = new PieceBag();
  });

  describe('constructor', () => {
    it('initializes with empty colorBag', () => {
      expect(bag.colorBag).toEqual([]);
    });
  });

  describe('reset', () => {
    it('clears the colorBag', () => {
      bag.colorBag = [1, 2, 3];
      bag.reset();
      expect(bag.colorBag).toEqual([]);
    });
  });

  describe('getState / setState', () => {
    it('returns current state', () => {
      bag.colorBag = [1, 2, 3];
      const state = bag.getState();
      expect(state.colorBag).toEqual([1, 2, 3]);
    });

    it('does not mutate original when state is read', () => {
      bag.colorBag = [1, 2, 3];
      const state = bag.getState();
      state.colorBag.push(4);
      expect(bag.colorBag).toEqual([1, 2, 3]);
    });

    it('restores state via setState', () => {
      bag.setState({ colorBag: [4, 5, 6] });
      expect(bag.colorBag).toEqual([4, 5, 6]);
    });

    it('handles setState with no colorBag', () => {
      bag.setState({});
      expect(bag.colorBag).toEqual([]);
    });
  });

  describe('getNextColor', () => {
    it('returns a valid color', () => {
      const rng = seedrandom('test');
      const color = bag.getNextColor(rng);
      expect(Object.values(COLOR)).toContain(color);
    });

    it('refills bag when empty and returns a color', () => {
      const rng = seedrandom('test');
      expect(bag.colorBag.length).toBe(0);
      const color = bag.getNextColor(rng);
      expect(Object.values(COLOR)).toContain(color);
    });

    it('returns all 7 colors exactly once before refilling', () => {
      const rng = seedrandom('test-colors');
      const colorCount = Object.values(COLOR).length;
      const colors = [];
      for (let i = 0; i < colorCount; i++) {
        colors.push(bag.getNextColor(rng));
      }
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colorCount);
    });

    it('refills automatically when bag is exhausted', () => {
      const rng = seedrandom('refill-test');
      const colorCount = Object.values(COLOR).length;
      // Exhaust the bag
      for (let i = 0; i < colorCount; i++) {
        bag.getNextColor(rng);
      }
      // Now it should refill
      const color = bag.getNextColor(rng);
      expect(Object.values(COLOR)).toContain(color);
    });
  });
});
