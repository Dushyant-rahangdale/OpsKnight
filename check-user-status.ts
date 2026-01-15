import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'dushyantrahangdale5@gmail.com';
  console.log(`Checking user status for: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('❌ User NOT FOUND in the connected database.');
    // Check for similar emails?
    const allUsers = await prisma.user.findMany({
      select: { email: true },
    });
    console.log(
      'Available users:',
      allUsers.map(u => u.email)
    );
  } else {
    console.log('✅ User FOUND:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Status: ${user.status}`);
    console.log(`- Has Password Hash: ${user.passwordHash ? 'YES' : 'NO'}`);
    console.log(`- Token Version: ${user.tokenVersion}`);
  }
}

main()
  .catch(e => {
    console.error('Error running script:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
