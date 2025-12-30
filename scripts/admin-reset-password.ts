import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: ts-node admin-reset-password.ts <email> <new-password>');
        process.exit(1);
    }

    const [email, newPassword] = args;

    console.log(`Resetting password for user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error('User not found.');
        process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
        where: { email },
        data: {
            passwordHash,
            status: 'ACTIVE',
            invitedAt: null
        }
    });

    console.log(`Password reset successfully for ${email}.`);

    // Log audit manually if possible, but this is a script.
    // We can try to write to AuditLog table.
    try {
        await prisma.auditLog.create({
            data: {
                action: 'ADMIN_CLI_RESET_PASSWORD',
                entityType: 'USER',
                entityId: user.id,
                details: { email, note: 'Reset via CLI' }
            }
        });
        console.log('Audit log entry created.');
    } catch (e) {
        console.warn('Failed to create audit log entry:', e);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
