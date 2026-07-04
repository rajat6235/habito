import { PrismaClient } from '@prisma/client';

/**
 * Base repository — all concrete repositories extend this.
 * Injects the Prisma client at construction time, enabling
 * transactional usage by passing a Prisma transaction client.
 */
export abstract class BaseRepository {
  constructor(protected readonly db: PrismaClient) {}
}
