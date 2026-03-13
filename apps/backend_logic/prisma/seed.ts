import 'dotenv/config';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing from .env`);
  }
  return value;
}

const DATABASE_URL = requireEnv('DATABASE_URL');
const ADMIN_EMAIL = requireEnv('SEED_ADMIN_EMAIL');
const ADMIN_USERNAME = requireEnv('SEED_ADMIN_USERNAME');
const ADMIN_PASSWORD = requireEnv('SEED_ADMIN_PASSWORD');

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: DATABASE_URL }),
  });

  try {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    // Create if missing, otherwise ensure role/status are correct
    const user = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      create: {
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.APPROVED,
        approvedAt: new Date(),
      },
      update: {
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    console.log('Seeded SUPER_ADMIN:', {
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
