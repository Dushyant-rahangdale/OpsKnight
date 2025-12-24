import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const DEFAULT_SECRET = process.env.API_KEY_SECRET || process.env.NEXTAUTH_SECRET || '';

if (!DEFAULT_SECRET) {
    console.warn('WARNING: No API_KEY_SECRET or NEXTAUTH_SECRET found. Token hashing may fail verification if app uses valid secret.');
}

function hashToken(token: string) {
    const hash = createHash('sha256');
    hash.update(`${DEFAULT_SECRET}:${token}`);
    return hash.digest('hex');
}

async function main() {
    // 1. Create User
    const user = await prisma.user.upsert({
        where: { email: 'api-tester@example.com' },
        update: {},
        create: {
            email: 'api-tester@example.com',
            name: 'API Tester',
            role: 'ADMIN',
            status: 'ACTIVE'
        }
    });

    // 2. Create Service
    // We create a new one each time to avoid "needs unique" constraints unless we check name
    // Using upsert on name just to be clean
    let service = await prisma.service.findFirst({ where: { name: 'Critical API Service' } });
    if (!service) {
        service = await prisma.service.create({
            data: {
                name: 'Critical API Service',
                status: 'OPERATIONAL'
            }
        });
    }

    // 3. Create API Key
    const raw = randomBytes(32).toString('base64url');
    const token = `ok_${raw}`;
    const tokenHash = hashToken(token);

    await prisma.apiKey.create({
        data: {
            name: `Test Key ${Date.now()}`,
            prefix: token.slice(0, 8),
            tokenHash: tokenHash,
            // Add all scopes needed for testing
            scopes: ['incidents:write', 'incidents:read', 'services:read'],
            userId: user.id
        }
    });

    console.log(JSON.stringify({
        apiKey: token,
        serviceId: service.id
    }));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
