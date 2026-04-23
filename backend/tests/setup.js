const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Set test environment
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  // Connect to test database
  console.log('Setting up test database...');
});

afterAll(async () => {
  // Clean up test database
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up data before each test
  // Delete in order to respect foreign key constraints
  await prisma.refreshToken.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.squadPlayer.deleteMany();
  await prisma.squad.deleteMany();
  await prisma.user.deleteMany();
});
