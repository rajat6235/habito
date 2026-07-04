import { PrismaClient, User, Prisma, RoleName } from '@prisma/client';
import { BaseRepository } from './base.repository';

export type UserWithRoles = User & { roles: { role: { name: RoleName } }[] };

export class UserRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByIdWithRoles(id: string): Promise<UserWithRoles | null> {
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
      include: { roles: { include: { role: true } } },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' }, deletedAt: null },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.db.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.db.user.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'deleted' },
    });
  }

  async assignRole(userId: string, roleName: RoleName, assignedBy: string): Promise<void> {
    const role = await this.db.role.findUniqueOrThrow({ where: { name: roleName } });
    await this.db.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      create: { userId, roleId: role.id, assignedBy },
      update: {},
    });
  }

  async getUserRoles(userId: string): Promise<RoleName[]> {
    const userRoles = await this.db.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map(ur => ur.role.name);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async findMany(params: {
    search?: string;
    status?: 'active' | 'disabled' | 'deleted';
    skip: number;
    take: number;
  }): Promise<{ data: User[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { email: { contains: params.search, mode: 'insensitive' } },
              { firstName: { contains: params.search, mode: 'insensitive' } },
              { lastName: { contains: params.search, mode: 'insensitive' } },
              { username: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.db.$transaction([
      this.db.user.findMany({ where, skip: params.skip, take: params.take, orderBy: { createdAt: 'desc' } }),
      this.db.user.count({ where }),
    ]);

    return { data, total };
  }
}
