const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Check if admin exists
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@lumaa.ai' }
    });

    if (!adminExists) {
      // Create admin user
      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@lumaa.ai',
          password: 'pass',
          role: 'admin',
          category: 'sales',
          pinCode: '1234',
          function: 'System Administrator',
          sipEndpoints: 'sip:admin1@lumaa.ai,sip:admin2@lumaa.ai',
          concurrency: 10,
          minSubscribed: 99999,
          minUsed: 0,
          creditsRemaining: 1000,
          monthlyPlanCost: 0
        }
      });
      console.log('✅ Admin user created');
    }

    // Check if demo user exists
    const userExists = await prisma.user.findUnique({
      where: { email: 'user@lumaa.ai' }
    });

    if (!userExists) {
      // Create demo user
      await prisma.user.create({
        data: {
          name: 'Demo User',
          email: 'user@lumaa.ai',
          password: 'pass',
          role: 'user',
          category: 'real_estate',
          pinCode: '5678',
          function: 'Real Estate Agent',
          sipEndpoints: 'sip:user1@lumaa.ai,sip:user2@lumaa.ai',
          concurrency: 5,
          minSubscribed: 1000,
          minUsed: 234,
          creditsRemaining: 250,
          monthlyPlanCost: 150
        }
      });
      console.log('✅ Demo user created');
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('- Admin: admin@lumaa.ai / pass (PIN: 1234)');
    console.log('- User: user@lumaa.ai / pass (PIN: 5678)\n');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();