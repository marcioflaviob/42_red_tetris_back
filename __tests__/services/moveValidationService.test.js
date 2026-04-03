import moveValidationService from '../../services/moveValidationService.js';
import { MOVES, BOARD_ROWS, BUFFER_ZONE_ROWS } from '../../models/constants.js';
import { ApiException } from '../../utils/ApiException.js';

describe('MoveValidationService', () => {
  describe('validateMoveRequest', () => {
    it('returns true for valid action', () => {
      expect(moveValidationService.validateMoveRequest({ action: MOVES.DOWN })).toBe(true);
      expect(moveValidationService.validateMoveRequest({ action: MOVES.LEFT })).toBe(true);
      expect(moveValidationService.validateMoveRequest({ action: MOVES.RIGHT })).toBe(true);
      expect(moveValidationService.validateMoveRequest({ action: MOVES.ROTATE })).toBe(true);
      expect(moveValidationService.validateMoveRequest({ action: MOVES.SAVE })).toBe(true);
      expect(moveValidationService.validateMoveRequest({ action: MOVES.SOFT_DROP })).toBe(true);
      expect(moveValidationService.validateMoveRequest({ action: MOVES.HARD_DROP })).toBe(true);
    });

    it('throws when data is null', () => {
      expect(() => moveValidationService.validateMoveRequest(null)).toThrow(ApiException);
    });

    it('throws when action is missing', () => {
      expect(() => moveValidationService.validateMoveRequest({})).toThrow(ApiException);
    });

    it('throws for invalid action', () => {
      expect(() =>
        moveValidationService.validateMoveRequest({ action: 'jump' })
      ).toThrow(ApiException);
    });

    it('throws with 400 status for missing action', () => {
      try {
        moveValidationService.validateMoveRequest({});
      } catch (e) {
        expect(e.statusCode).toBe(400);
        expect(e.message).toBe('Action is required');
      }
    });

    it('throws with 400 status for invalid action', () => {
      try {
        moveValidationService.validateMoveRequest({ action: 'invalid' });
      } catch (e) {
        expect(e.statusCode).toBe(400);
        expect(e.message).toBe('Invalid action');
      }
    });
  });

  describe('validateRowClearRequest', () => {
    const validRow = BUFFER_ZONE_ROWS + 1;

    it('returns true for valid request', () => {
      expect(
        moveValidationService.validateRowClearRequest(
          { action: 'clear-row', rows: [validRow] },
          null
        )
      ).toBe(true);
    });

    it('throws when action is missing', () => {
      expect(() =>
        moveValidationService.validateRowClearRequest({ rows: [validRow] }, null)
      ).toThrow(ApiException);
    });

    it('throws when action is not clear-row', () => {
      expect(() =>
        moveValidationService.validateRowClearRequest(
          { action: 'wrong-action', rows: [validRow] },
          null
        )
      ).toThrow(ApiException);
    });

    it('throws when rows is missing', () => {
      expect(() =>
        moveValidationService.validateRowClearRequest({ action: 'clear-row' }, null)
      ).toThrow(ApiException);
    });

    it('throws when rows is not an array', () => {
      expect(() =>
        moveValidationService.validateRowClearRequest(
          { action: 'clear-row', rows: 5 },
          null
        )
      ).toThrow(ApiException);
    });

    it('throws when rows array is empty', () => {
      expect(() =>
        moveValidationService.validateRowClearRequest(
          { action: 'clear-row', rows: [] },
          null
        )
      ).toThrow(ApiException);
    });

    it('throws when rows contain non-integers', () => {
      expect(() =>
        moveValidationService.validateRowClearRequest(
          { action: 'clear-row', rows: [1.5, validRow] },
          null
        )
      ).toThrow(ApiException);
    });

    it('throws when rows have duplicates', () => {
      expect(() =>
        moveValidationService.validateRowClearRequest(
          { action: 'clear-row', rows: [validRow, validRow] },
          null
        )
      ).toThrow(ApiException);
    });

    it('validates row range when board is provided', () => {
      const board = {};
      expect(
        moveValidationService.validateRowClearRequest(
          { action: 'clear-row', rows: [BUFFER_ZONE_ROWS] },
          board
        )
      ).toBe(true);
    });

    it('throws when row is below buffer zone with board', () => {
      const board = {};
      expect(() =>
        moveValidationService.validateRowClearRequest(
          { action: 'clear-row', rows: [0] },
          board
        )
      ).toThrow(ApiException);
    });

    it('throws when row is above board end with board', () => {
      const board = {};
      const outOfRange = BUFFER_ZONE_ROWS + BOARD_ROWS + 5;
      expect(() =>
        moveValidationService.validateRowClearRequest(
          { action: 'clear-row', rows: [outOfRange] },
          board
        )
      ).toThrow(ApiException);
    });
  });

  describe('canExecuteMove', () => {
    it('returns false when board is null', () => {
      expect(moveValidationService.canExecuteMove(null)).toBe(false);
    });

    it('returns false when board is undefined', () => {
      expect(moveValidationService.canExecuteMove(undefined)).toBe(false);
    });

    it('returns false when board.gameOver is true', () => {
      expect(moveValidationService.canExecuteMove({ gameOver: true })).toBe(false);
    });

    it('returns true when board exists and gameOver is false', () => {
      expect(moveValidationService.canExecuteMove({ gameOver: false })).toBe(true);
    });
  });
});
