import { BOARD_ROWS, BUFFER_ZONE_ROWS, MOVES } from '../models/constants.js';
import { ApiException } from '../utils/ApiException.js';

class MoveValidationService {
  validateMoveRequest(data) {
    if (!data?.action) {
      throw new ApiException('Action is required', 400);
    }

    if (!Object.values(MOVES).includes(data.action)) {
      throw new ApiException('Invalid action', 400);
    }

    return true;
  }

  validateRowClearRequest(data, board) {
    if (!data?.action || data.action !== 'clear-row') {
      throw new ApiException('Invalid action for row clearing', 400);
    }

    if (!data?.rows || !Array.isArray(data.rows)) {
      throw new ApiException('Rows array is required', 400);
    }

    if (data.rows.length === 0) {
      throw new ApiException('At least one row must be specified', 400);
    }

    if (!data.rows.every((row) => Number.isInteger(row))) {
      throw new ApiException('All rows must be integers', 400);
    }

    const uniqueRows = new Set(data.rows);
    if (uniqueRows.size !== data.rows.length) {
      throw new ApiException('Rows must be unique', 400);
    }

    if (board) {
      const startRow = BUFFER_ZONE_ROWS;
      const endRow = BUFFER_ZONE_ROWS + BOARD_ROWS - 1;

      for (const row of data.rows) {
        if (row < startRow || row > endRow) {
          throw new ApiException(`Row ${row} is out of valid range`, 400);
        }
      }
    }

    return true;
  }

  canExecuteMove(board) {
    if (!board || board.gameOver) {
      return false;
    }

    return true;
  }
}

export default new MoveValidationService();
