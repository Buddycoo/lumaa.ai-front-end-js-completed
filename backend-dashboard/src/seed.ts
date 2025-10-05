import { PrismaClient, Role, CallStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create SuperAdmin
  const superAdminPassword = await bcrypt.hash('admin123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@lumaa.ai' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@lumaa.ai',
      password: superAdminPassword,
      role: 'SUPERADMIN',
      minutesLeft: 10000,
      isActive: true
    }
  });
  console.log('✅ Created SuperAdmin:', superAdmin.email);

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'manager@lumaa.ai' },
    update: {},
    create: {
      name: 'Admin Manager',
      email: 'manager@lumaa.ai',
      password: adminPassword,
      role: 'ADMIN',
      minutesLeft: 5000,
      isActive: true
    }
  });
  console.log('✅ Created Admin:', admin.email);

  // Create Test Users
  const users = [
    {
      name: 'Ahmed Hassan',
      email: 'ahmed@emirates.ae',
      role: 'USER' as Role,
      minutesLeft: 1000,
      minutesUsed: 234.5
    },
    {
      name: 'Sarah Al-Mansouri',
      email: 'sarah@techinnovations.ae',
      role: 'USER' as Role,
      minutesLeft: 750,
      minutesUsed: 156.2
    },
    {
      name: 'Maria Rodriguez',
      email: 'maria@luxuryhotels.ae',
      role: 'USER' as Role,
      minutesLeft: 2000,
      minutesUsed: 89.7
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const userPassword = await bcrypt.hash('user123', 12);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: userPassword,
        isActive: true
      }
    });
    createdUsers.push(user);
    console.log('✅ Created User:', user.email);
  }

  // Create Bot Settings for all users
  for (const user of [superAdmin, admin, ...createdUsers]) {
    await prisma.botSetting.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        openingMessage: `Hello! I'm your AI assistant from Lumaa AI. How can I help you today?`,
        model: 'GPT-4.1',
        temperature: 0.7,
        responseLength: 150,
        category: 'sales',
        isActive: true
      }
    });
  }
  console.log('✅ Created Bot Settings for all users');

  // Create System Status
  const systemServices = ['ai', 'calls', 'whatsapp'];
  for (const service of systemServices) {
    await prisma.systemStatus.upsert({
      where: { serviceName: service },
      update: {},
      create: {
        serviceName: service,
        isEnabled: true,
        updatedBy: superAdmin.id
      }
    });
  }
  console.log('✅ Created System Status entries');

  // Create Sample Call Logs
  const callStatuses: CallStatus[] = ['SUCCESS', 'FAILED', 'BUSY', 'NO_ANSWER'];
  const projects = ['Real Estate Leads', 'Hotel Bookings', 'Tech Support', 'Sales Outreach'];
  
  for (let i = 0; i < 50; i++) {
    const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const randomStatus = callStatuses[Math.floor(Math.random() * callStatuses.length)];
    const randomProject = projects[Math.floor(Math.random() * projects.length)];
    
    // Generate random call data
    const duration = Math.random() * 10 + 1; // 1-11 minutes
    const cost = duration * (0.5 + Math.random() * 0.5); // 0.5-1.0 AED per minute
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
    
    await prisma.callLog.create({
      data: {
        callId: `CALL_${Date.now()}_${i}`,
        userId: randomUser.id,
        number: `+971-5${Math.floor(Math.random() * 9000000) + 1000000}`,
        duration,
        cost,
        status: randomStatus,
        evaluation: randomStatus === 'SUCCESS' ? 'Positive interaction, lead qualified' : 'Call not completed',
        project: randomProject,
        transcript: randomStatus === 'SUCCESS' ? 
          `Customer: Hello?\nAI: Hello! I'm calling from Lumaa AI regarding ${randomProject}. Is this a good time to talk?\nCustomer: Yes, tell me more...\n[Conversation continues...]` : 
          null,
        createdAt
      }
    });
    
    // Update user's minutes used
    if (randomStatus === 'SUCCESS') {
      await prisma.user.update({
        where: { id: randomUser.id },
        data: {
          minutesUsed: { increment: duration },
          minutesLeft: { decrement: duration }
        }
      });
    }
  }
  console.log('✅ Created 50 sample call logs');

  // Create Clients
  const clients = [
    {
      name: 'Emirates Properties',
      email: 'contact@emirates-properties.ae',
      phone: '+971-4-123-4567',
      company: 'Emirates Properties LLC',
      plan: 'business',
      monthlySpend: 12500.00
    },
    {
      name: 'Tech Innovations Dubai',
      email: 'info@techinnovations.ae',
      phone: '+971-4-234-5678',
      company: 'Tech Innovations FZE',
      plan: 'enterprise',
      monthlySpend: 28750.00
    },
    {
      name: 'Luxury Hotels Group',
      email: 'bookings@luxuryhotels.ae',
      phone: '+971-4-345-6789',
      company: 'Luxury Hotels Group',
      plan: 'starter',
      monthlySpend: 4200.00
    }
  ];

  for (const clientData of clients) {
    await prisma.client.upsert({
      where: { email: clientData.email },
      update: {},
      create: clientData
    });
  }
  console.log('✅ Created sample clients');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('SuperAdmin: admin@lumaa.ai / admin123');
  console.log('Admin: manager@lumaa.ai / admin123');
  console.log('User: ahmed@emirates.ae / user123');
  console.log('User: sarah@techinnovations.ae / user123');
  console.log('User: maria@luxuryhotels.ae / user123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });