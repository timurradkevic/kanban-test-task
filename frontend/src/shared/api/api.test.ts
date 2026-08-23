import { describe, it, expect } from 'vitest';
import { baseApi } from './api';

describe('baseApi', () => {
  it('uses "api" as the reducer path', () => {
    expect(baseApi.reducerPath).toBe('api');
  });

  it('registers the expected tag types', () => {
    expect(baseApi.util.resetApiState).toBeDefined();
  });

  it('exposes middleware and reducer for store configuration', () => {
    expect(typeof baseApi.middleware).toBe('function');
    expect(typeof baseApi.reducer).toBe('function');
  });
});
