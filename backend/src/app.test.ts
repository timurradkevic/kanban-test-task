import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app.js';

describe('GET /health', () => {
  it('returns 200 and status ok', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('unmatched routes', () => {
  it('returns 404 with a JSON error body for a route that matches nothing', async () => {
    const response = await request(app).get('/definitely-not-a-real-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not Found' });
  });

  it('returns 404 for an unsupported method on a mounted router prefix', async () => {
    const response = await request(app).delete('/boards');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not Found' });
  });
});
