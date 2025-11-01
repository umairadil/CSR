import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminEmail = 'admin@csr.com';
  const agentEmail = 'agent@csr.com';

  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const agentPasswordHash = await bcrypt.hash('Agent@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      passwordHash: adminPasswordHash
    }
  });

  const agent = await prisma.user.upsert({
    where: { email: agentEmail },
    update: {},
    create: {
      email: agentEmail,
      name: 'Agent',
      role: 'CSR_AGENT',
      status: 'ACTIVE',
      passwordHash: agentPasswordHash
    }
  });

      // Add more test users
      const additionalUsers = [
        { name: 'UMAIR', email: 'umair@csr.com', role: 'CSR_AGENT' },
        { name: 'AHMED', email: 'ahmed@csr.com', role: 'CSR_AGENT' },
        { name: 'FARHAN', email: 'farhan@csr.com', role: 'CSR_AGENT' },
        { name: 'SARA', email: 'sara@csr.com', role: 'CSR_AGENT' },
        { name: 'ALI', email: 'ali@csr.com', role: 'CSR_AGENT' },
        { name: 'FATIMA', email: 'fatima@csr.com', role: 'CSR_AGENT' },
        { name: 'HASSAN', email: 'hassan@csr.com', role: 'CSR_AGENT' },
        { name: 'AYESHA', email: 'ayesha@csr.com', role: 'CSR_AGENT' },
        { name: 'UMAIR ADIL', email: 'umairadil1@gmail.com', role: 'CSR_AGENT' },
      ];

  for (const userData of additionalUsers) {
    const passwordHash = await bcrypt.hash('Agent@123', 10);
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        status: 'ACTIVE',
        passwordHash: passwordHash
      }
    });
  }

  const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];
  const products = ['Phone Case', 'Charger', 'Headphones', 'Power Bank', 'Smartwatch', 'USB Cable'];

  function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Create 50 sample orders
  for (let i = 1; i <= 50; i++) {
    const qty = Math.ceil(Math.random() * 3);
    const item = randomChoice(products);
    const items = [
      { name: item, price: Number((Math.random() * 50 + 10).toFixed(2)), qty }
    ];
    const city = randomChoice(cities);
    const statusWeights = ['ACTIVE', 'ACTIVE', 'CONFIRMED', 'CANCELLED', 'POSTPONED'];
    const status = randomChoice(statusWeights);

    const order = await prisma.order.create({
      data: {
        customerName: `Customer ${i}`,
        mobileNumber: `03${Math.floor(100000000 + Math.random() * 900000000)}`,
        productsJson: JSON.stringify(items),
        quantity: qty,
        city,
        address: `${Math.ceil(Math.random() * 100)} Street, ${city}`,
        codAmount: Number((Math.random() * 100 + 20).toFixed(2)),
        remarks: i % 5 === 0 ? 'Urgent delivery' : null,
        status,
        assignedTo: status === 'ACTIVE' ? { connect: { id: agent.id } } : undefined,
        confirmationDate: status === 'CONFIRMED' ? new Date() : null
      }
    });

    // NO FAKE ATTEMPTS - All orders start clean
    // Attempts will only be created when agents actually make calls
  }

  console.log('Seed completed:', { admin: admin.email, agent: agent.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


