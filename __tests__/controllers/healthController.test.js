import { jest } from '@jest/globals';
import { getHealth } from '../../controllers/healthController.js';

describe('getHealth', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('responds with 200 status', () => {
    getHealth(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('responds with OK status', () => {
    getHealth(req, res);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('OK');
  });

  it('includes uptime field', () => {
    getHealth(req, res);
    const body = res.json.mock.calls[0][0];
    expect(typeof body.uptime).toBe('number');
  });

  it('includes timestamp field', () => {
    getHealth(req, res);
    const body = res.json.mock.calls[0][0];
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp)).toBeInstanceOf(Date);
  });

  it('includes processingTime field', () => {
    getHealth(req, res);
    const body = res.json.mock.calls[0][0];
    expect(body.processingTime).toMatch(/ms$/);
  });
});
