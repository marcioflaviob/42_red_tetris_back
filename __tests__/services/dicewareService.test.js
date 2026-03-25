import dicewareService from '../../services/dicewareService.js';

describe('DicewareService', () => {
  it('loads words successfully', () => {
    expect(dicewareService.isLoaded).toBe(true);
    expect(dicewareService.words.length).toBeGreaterThan(0);
  });

  describe('getRandomWord', () => {
    it('returns a non-empty string', () => {
      const word = dicewareService.getRandomWord();
      expect(typeof word).toBe('string');
      expect(word.length).toBeGreaterThan(0);
    });

    it('returns different words across multiple calls (probabilistic)', () => {
      const words = new Set();
      for (let i = 0; i < 20; i++) {
        words.add(dicewareService.getRandomWord());
      }
      expect(words.size).toBeGreaterThan(1);
    });

    it('throws when words are not loaded', () => {
      const original = dicewareService.isLoaded;
      dicewareService.isLoaded = false;
      expect(() => dicewareService.getRandomWord()).toThrow();
      dicewareService.isLoaded = original;
    });
  });

  describe('getTwoRandomWordsAsTuple', () => {
    it('returns an array of two strings', () => {
      const tuple = dicewareService.getTwoRandomWordsAsTuple();
      expect(Array.isArray(tuple)).toBe(true);
      expect(tuple.length).toBe(2);
      expect(typeof tuple[0]).toBe('string');
      expect(typeof tuple[1]).toBe('string');
    });

    it('allows duplicates when allowDuplicates is true', () => {
      // Just verify it returns two words (may or may not be same)
      const tuple = dicewareService.getTwoRandomWordsAsTuple(true);
      expect(tuple.length).toBe(2);
    });
  });

  describe('getTwoRandomWords', () => {
    it('returns a hyphenated string', () => {
      const result = dicewareService.getTwoRandomWords();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/.+-.+/);
    });

    it('returns different values across calls (probabilistic)', () => {
      const results = new Set();
      for (let i = 0; i < 10; i++) {
        results.add(dicewareService.getTwoRandomWords());
      }
      expect(results.size).toBeGreaterThan(1);
    });
  });
});
