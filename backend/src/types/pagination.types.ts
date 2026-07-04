export interface CursorPaginationParams {
  cursor: string | undefined;
  limit: number;
  direction: 'forward' | 'backward';
}

export interface OffsetPaginationParams {
  page: number;
  limit: number;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  total?: number;
}

export interface OffsetPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
