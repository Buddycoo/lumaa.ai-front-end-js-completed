const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Quick seeding demo users...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('pass', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Dashboard',
      email: 'admin@lumaa.ai',
      password: adminPassword,
      role: 'ADMIN',
      minutesLeft: 10000,
      isActive: true
    }
  });
  console.log('✅ Created Admin:', admin.email);

  // Create Regular User
  const userPassword = await bcrypt.hash('pass', 12);
  const user = await prisma.user.create({
    data: {
      name: 'User Dashboard',
      email: 'user@lumaa.ai',
      password: userPassword,
      role: 'USER',
      minutesLeft: 1000,
      minutesUsed: 234.5,
      isActive: true
    }
  });
  console.log('✅ Created User:', user.email);

  console.log('\\n📝 Demo Credentials:');
  console.log('👑 Admin: admin@lumaa.ai / pass');
  console.log('👤 User:  user@lumaa.ai / pass');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });