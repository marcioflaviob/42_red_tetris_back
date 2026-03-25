import { jest } from '@jest/globals';
import { errorHandler, asyncHandler } from '../../utils/errorHandler.js';

describe('errorHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('uses error statusCode when present', () => {
    const err = { statusCode: 404, message: 'Not found' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found', status: 404 });
  });

  it('defaults to 500 when no statusCode', () => {
    const err = { message: 'Unknown error' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('uses default message when none provided', () => {
    const err = {};
    errorHandler(err, req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Something went wrong' })
    );
  });
});

describe('asyncHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = { json: jest.fn() };
    next = jest.fn();
  });

  it('calls the wrapped function with req, res, next', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(fn);
    await wrapped(req, res, next);
    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it('calls next with error when promise rejects', async () => {
    const error = new Error('Async error');
    const fn = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(fn);
    await wrapped(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('does not call next on success', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(fn);
    await wrapped(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
});
