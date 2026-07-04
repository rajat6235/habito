import { describe, it, expect, vi } from 'vitest';
import type { Response } from 'express';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../utils/response';

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
    send(body?: unknown) { this.body = body; return this; },
  };
  vi.spyOn(res, 'status');
  vi.spyOn(res, 'json');
  vi.spyOn(res, 'send');
  return res as unknown as Response & typeof res;
}

describe('sendSuccess', () => {
  it('returns 200 with success:true and data', () => {
    const res = mockRes();
    sendSuccess(res, { id: '1', name: 'test' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: { id: '1', name: 'test' } });
  });

  it('accepts a custom status code', () => {
    const res = mockRes();
    sendSuccess(res, 'ok', 202);
    expect(res.statusCode).toBe(202);
  });

  it('includes meta when provided', () => {
    const res = mockRes();
    sendSuccess(res, [], 200, { total: 0 });
    expect((res.body as { meta: unknown }).meta).toEqual({ total: 0 });
  });

  it('omits meta key when not provided', () => {
    const res = mockRes();
    sendSuccess(res, 'x');
    expect(res.body).not.toHaveProperty('meta');
  });
});

describe('sendCreated', () => {
  it('returns 201', () => {
    const res = mockRes();
    sendCreated(res, { id: 'new' });
    expect(res.statusCode).toBe(201);
    expect((res.body as { success: boolean }).success).toBe(true);
  });
});

describe('sendNoContent', () => {
  it('returns 204 with empty body', () => {
    const res = mockRes();
    sendNoContent(res);
    expect(res.statusCode).toBe(204);
  });
});

describe('sendPaginated', () => {
  const items = [{ id: '1' }, { id: '2' }];

  it('returns 200 with data array', () => {
    const res = mockRes();
    sendPaginated(res, items, { hasNextPage: false, nextCursor: null });
    expect(res.statusCode).toBe(200);
    expect((res.body as { data: unknown }).data).toEqual(items);
  });

  it('nests pagination info inside meta.pagination', () => {
    const res = mockRes();
    sendPaginated(res, items, { hasNextPage: true, nextCursor: 'cursor-abc' });
    const body = res.body as { meta: { pagination: { hasNextPage: boolean; nextCursor: string } } };
    expect(body.meta.pagination.hasNextPage).toBe(true);
    expect(body.meta.pagination.nextCursor).toBe('cursor-abc');
  });

  it('works with an empty array', () => {
    const res = mockRes();
    sendPaginated(res, [], { hasNextPage: false });
    expect((res.body as { data: unknown[] }).data).toEqual([]);
  });

  it('passes through all pagination fields', () => {
    const res = mockRes();
    sendPaginated(res, [], { total: 50, page: 2, limit: 20, totalPages: 3 });
    const pag = (res.body as { meta: { pagination: Record<string, unknown> } }).meta.pagination;
    expect(pag['total']).toBe(50);
    expect(pag['page']).toBe(2);
    expect(pag['totalPages']).toBe(3);
  });
});
