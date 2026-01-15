import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'dushyantrahangdale5@gmail.com';
  const password = 'Dushyant@1234';
  const hashedPassword = await bcrypt.hash(password, 12);

  console.log(`Creating user ${email}...`);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: hashedPassword,
        status: 'ACTIVE',
        role: 'ADMIN', // Giving admin role to ensure access
        emailVerified: new Date(),
      },
      create: {
        email,
        name: 'Dushyant Rahangdale',
        passwordHash: hashedPassword,
        status: 'ACTIVE',
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    console.log(`User ${email} created/updated successfully.`);
    console.log(`User ID: ${user.id}`);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
