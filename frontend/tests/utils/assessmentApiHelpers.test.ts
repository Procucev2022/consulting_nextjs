import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getJson, postJson, API_BASE } from '../../src/utils/assessmentApiHelpers';

describe('assessmentApiHelpers', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('exposes API_BASE string', () => {
    expect(typeof API_BASE).toBe('string');
  });

  describe('getJson', () => {
    it('returns data property if present on successful response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { foo: 'bar' } })
      });

      const res = await getJson<{ foo: string }>('/test', 'Test error');
      expect(res).toEqual({ foo: 'bar' });
    });

    it('returns raw json if data is not present on successful response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' })
      });

      const res = await getJson<{ status: string }>('/test', 'Test error');
      expect(res).toEqual({ status: 'ok' });
    });

    it('throws error with prefix and status if res.ok is false', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      });

      await expect(getJson('/test', 'Fetch resource')).rejects.toThrow('Fetch resource: HTTP 404');
    });
  });

  describe('postJson', () => {
    it('sends POST request and returns data on success', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: '123' } })
      });

      const res = await postJson<{ id: string }>('/create', { name: 'sample' }, 'Create error');
      expect(res).toEqual({ id: '123' });
      expect(global.fetch).toHaveBeenCalledWith('/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'sample' })
      });
    });

    it('supports PATCH method and returns json when data property is absent', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, updated: true })
      });

      const res = await postJson<{ success: boolean; updated: boolean }>(
        '/update',
        { status: 'active' },
        'Update error',
        'PATCH'
      );
      expect(res).toEqual({ success: true, updated: true });
      expect(global.fetch).toHaveBeenCalledWith('/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });
    });

    it('throws with json.message when request fails with error message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ success: false, message: 'Invalid payload provided' })
      });

      await expect(postJson('/test', {}, 'Submit error')).rejects.toThrow('Invalid payload provided');
    });

    it('throws with prefix and status when request fails without message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({})
      });

      await expect(postJson('/test', {}, 'Server error')).rejects.toThrow('Server error: HTTP 500');
    });
  });
});
