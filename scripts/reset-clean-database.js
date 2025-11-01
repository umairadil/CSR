const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function resetCleanDatabase() {
  console.log('🧹 Resetting database with clean data...');
  
  try {
    // Step 1: Delete all existing data
    console.log('🗑️  Deleting all existing data...');
    await prisma.attempt.deleteMany();
    await prisma.order.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ All existing data deleted');

    // Step 2: Reset and run migrations
    console.log('🔄 Running database migrations...');
    execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
    
    // Step 3: Seed with clean data
    console.log('🌱 Seeding with clean data...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    
    console.log('🎉 Database reset completed with clean data!');
    console.log('📊 All orders now have 0 attempts and real status');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetCleanDatabase();




