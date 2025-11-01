const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanFakeAttempts() {
  console.log('🧹 Cleaning up fake attempts from seed data...');
  
  try {
    // Find all ACTIVE orders that have attempts
    const activeOrdersWithAttempts = await prisma.order.findMany({
      where: {
        status: 'ACTIVE',
        attempts: {
          some: {}
        }
      },
      include: {
        attempts: true
      }
    });

    console.log(`Found ${activeOrdersWithAttempts.length} ACTIVE orders with attempts`);

    // Delete all attempts for ACTIVE orders (they should start clean)
    const deletedAttempts = await prisma.attempt.deleteMany({
      where: {
        order: {
          status: 'ACTIVE'
        }
      }
    });

    console.log(`✅ Deleted ${deletedAttempts.count} fake attempts from ACTIVE orders`);
    
    // Show remaining attempts (these should be for CONFIRMED/CANCELLED/POSTPONED orders)
    const remainingAttempts = await prisma.attempt.count();
    console.log(`📊 Remaining attempts: ${remainingAttempts} (these are for resolved orders)`);

    console.log('🎉 Cleanup completed! ACTIVE orders now have 0 attempts.');
    
  } catch (error) {
    console.error('❌ Error cleaning up attempts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanFakeAttempts();




