import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function hash(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

async function main() {
  console.log('🌱  Seeding database…');

  // ── Roles (idempotent — migration already inserts them) ──────────────────
  const [superAdminRole, adminRole, userRole] = await Promise.all([
    prisma.role.upsert({ where: { name: 'super_admin' }, update: {}, create: { name: 'super_admin', description: 'Full system access' } }),
    prisma.role.upsert({ where: { name: 'admin' },       update: {}, create: { name: 'admin',       description: 'User management access' } }),
    prisma.role.upsert({ where: { name: 'user' },        update: {}, create: { name: 'user',         description: 'Standard user' } }),
  ]);

  // ── Super-admin account ───────────────────────────────────────────────────
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@habito.local' } });
  if (!adminExists) {
    const admin = await prisma.user.create({
      data: {
        email:         'admin@habito.local',
        username:      'admin',
        passwordHash:  await hash('Admin123!'),
        firstName:     'Admin',
        lastName:      null,
        emailVerified: true,
        status:        'active',
        roles: {
          create: [
            { roleId: superAdminRole.id },
            { roleId: adminRole.id },
          ],
        },
        settings: { create: {} },
      },
    });
    await prisma.userLevel.create({ data: { userId: admin.id } });
    console.log('  ✅  Super-admin: admin@habito.local / Admin123!');
  } else {
    console.log('  ⏭️   Super-admin already exists');
  }

  // ── Regular test user ─────────────────────────────────────────────────────
  const userExists = await prisma.user.findUnique({ where: { email: 'demo@habito.local' } });
  if (!userExists) {
    const demo = await prisma.user.create({
      data: {
        email:         'demo@habito.local',
        username:      'demo',
        passwordHash:  await hash('Demo123!'),
        firstName:     'Demo',
        lastName:      'User',
        emailVerified: true,
        status:        'active',
        roles: {
          create: [{ roleId: userRole.id }],
        },
        settings: { create: {} },
      },
    });
    await prisma.userLevel.create({ data: { userId: demo.id } });

    // Seed a few habits for the demo user
    const categories = await prisma.habitCategory.findMany({ where: { isGlobal: true }, take: 3 });
    if (categories.length > 0) {
      await prisma.habit.createMany({
        data: [
          {
            userId:          demo.id,
            categoryId:      categories[0]?.id,
            title:           'Morning meditation',
            description:     '10 minutes of mindfulness',
            icon:            '🧘',
            color:           '#8B5CF6',
            frequencyType:   'daily',
            frequencyConfig: { type: 'daily' },
            priority:        'high',
          },
          {
            userId:          demo.id,
            categoryId:      categories[1]?.id ?? categories[0]?.id,
            title:           'Read for 30 minutes',
            icon:            '📚',
            color:           '#3B82F6',
            frequencyType:   'daily',
            frequencyConfig: { type: 'daily' },
            priority:        'medium',
          },
          {
            userId:          demo.id,
            categoryId:      categories[2]?.id ?? categories[0]?.id,
            title:           'Exercise',
            icon:            '🏋️',
            color:           '#10B981',
            frequencyType:   'weekly',
            frequencyConfig: { type: 'weekly', days: [1, 3, 5] },
            priority:        'high',
          },
        ],
      });
    }
    console.log('  ✅  Demo user: demo@habito.local / Demo123!');
  } else {
    console.log('  ⏭️   Demo user already exists');
  }

  console.log('✅  Seed complete.');
}

main()
  .catch((e) => { console.error('❌  Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
