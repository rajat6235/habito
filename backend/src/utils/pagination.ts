import { CursorPaginationParams, CursorPaginatedResult } from '../types/pagination.types';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parseCursorParams(query: Record<string, unknown>): CursorPaginationParams {
  const limit = Math.min(
    Number.isInteger(Number(query['limit'])) ? Number(query['limit']) : DEFAULT_LIMIT,
    MAX_LIMIT,
  );
  return {
    cursor: typeof query['cursor'] === 'string' ? query['cursor'] : undefined,
    limit,
    direction: query['direction'] === 'backward' ? 'backward' : 'forward',
  };
}

export function buildCursorResult<T extends { id: string }>(
  items: T[],
  limit: number,
): CursorPaginatedResult<T> {
  const hasNextPage = items.length > limit;
  const data = hasNextPage ? items.slice(0, limit) : items;
  const lastItem = data[data.length - 1];
  const firstItem = data[0];

  return {
    data,
    nextCursor: hasNextPage && lastItem ? lastItem.id : null,
    prevCursor: firstItem ? firstItem.id : null,
    hasNextPage,
    hasPrevPage: false,
  };
}

export function parseOffsetParams(query: Record<string, unknown>) {
  const page = Math.max(Number.isInteger(Number(query['page'])) ? Number(query['page']) : 1, 1);
  const limit = Math.min(
    Number.isInteger(Number(query['limit'])) ? Number(query['limit']) : DEFAULT_LIMIT,
    MAX_LIMIT,
  );
  return { page, limit, skip: (page - 1) * limit };
}
