import { ApiException } from '../../utils/ApiException.js';

describe('ApiException', () => {
  it('extends Error', () => {
    const err = new ApiException('Test error', 400);
    expect(err).toBeInstanceOf(Error);
  });

  it('sets message', () => {
    const err = new ApiException('Something went wrong', 500);
    expect(err.message).toBe('Something went wrong');
  });

  it('sets statusCode', () => {
    const err = new ApiException('Not found', 404);
    expect(err.statusCode).toBe(404);
  });

  it('defaults statusCode to 500', () => {
    const err = new ApiException('Internal error');
    expect(err.statusCode).toBe(500);
  });

  it('can be thrown and caught', () => {
    expect(() => {
      throw new ApiException('Forbidden', 403);
    }).toThrow('Forbidden');
  });
});
