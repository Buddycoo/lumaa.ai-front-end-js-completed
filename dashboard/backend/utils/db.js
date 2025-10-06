const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});

module.exports = prisma;