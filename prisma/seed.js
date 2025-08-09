const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function seed() {
  // Create a test user if it doesn't exist
  const existingUser = await prisma.user.findUnique({
    where: { id: 1 }
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      },
    });
    console.log('✅ Created test user');
  } else {
    console.log('✅ Test user already exists');
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
