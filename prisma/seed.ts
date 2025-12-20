import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

type TeamSeed = {
    name: string
    description: string
}

type UserSeed = {
    email: string
    name: string
    role: 'ADMIN' | 'RESPONDER' | 'USER'
}

type ServiceSeed = {
    name: string
    description: string
    status: 'OPERATIONAL' | 'DEGRADED' | 'PARTIAL_OUTAGE' | 'MAJOR_OUTAGE' | 'MAINTENANCE'
    teamId: string
    targetAckMinutes: number
    targetResolveMinutes: number
}

const demoPassword = 'Password123!'

const teamSeeds: TeamSeed[] = [
    { name: 'Platform Engineering', description: 'Core infrastructure and reliability' },
    { name: 'Payments Operations', description: 'Revenue-critical services and payments' },
    { name: 'Customer Support', description: 'Customer communication and incident comms' }
]

const userSeeds: UserSeed[] = [
    { email: 'alice@example.com', name: 'Alice DevOps', role: 'ADMIN' },
    { email: 'bob@example.com', name: 'Bob SRE', role: 'RESPONDER' },
    { email: 'carol@example.com', name: 'Carol Ops', role: 'RESPONDER' },
    { email: 'dave@example.com', name: 'Dave Analyst', role: 'USER' },
    { email: 'erin@example.com', name: 'Erin Oncall', role: 'RESPONDER' },
    { email: 'frank@example.com', name: 'Frank Support', role: 'RESPONDER' }
]

function daysAgo(days: number) {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date
}

function hoursFrom(date: Date, hours: number) {
    const next = new Date(date)
    next.setHours(next.getHours() + hours)
    return next
}

function randomPick<T>(items: T[]) {
    return items[Math.floor(Math.random() * items.length)]
}

function makeIntegrationKey() {
    return randomBytes(16).toString('hex')
}

async function getOrCreateTeam(seed: TeamSeed) {
    const existing = await prisma.team.findFirst({ where: { name: seed.name } })
    if (existing) return existing
    return prisma.team.create({ data: seed })
}

async function getOrCreateService(seed: ServiceSeed) {
    const existing = await prisma.service.findFirst({
        where: { name: seed.name, teamId: seed.teamId }
    })
    if (existing) return existing
    return prisma.service.create({ data: seed })
}

async function getOrCreatePolicy(name: string) {
    const existing = await prisma.escalationPolicy.findFirst({ where: { name } })
    if (existing) return existing
    return prisma.escalationPolicy.create({
        data: {
            name,
            description: `${name} policy`
        }
    })
}

async function ensurePolicySteps(policyId: string, userIds: string[]) {
    const existingSteps = await prisma.escalationRule.count({ where: { policyId } })
    if (existingSteps > 0) return
    const steps = userIds.slice(0, 3).map((userId, index) => ({
        policyId,
        targetUserId: userId,
        stepOrder: index,
        delayMinutes: index * 10
    }))
    if (steps.length) {
        await prisma.escalationRule.createMany({ data: steps })
    }
}

async function main() {
    const passwordHash = await bcrypt.hash(demoPassword, 10)

    const teams = await Promise.all(teamSeeds.map(getOrCreateTeam))
    const teamByName = new Map(teams.map((team) => [team.name, team]))

    const users = await Promise.all(
        userSeeds.map((user) =>
            prisma.user.upsert({
                where: { email: user.email },
                update: {},
                create: {
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    status: 'ACTIVE',
                    passwordHash
                }
            })
        )
    )
    const userByEmail = new Map(users.map((user) => [user.email, user]))

    await prisma.teamMember.createMany({
        data: [
            { teamId: teamByName.get('Platform Engineering')!.id, userId: userByEmail.get('alice@example.com')!.id, role: 'OWNER' },
            { teamId: teamByName.get('Platform Engineering')!.id, userId: userByEmail.get('bob@example.com')!.id, role: 'ADMIN' },
            { teamId: teamByName.get('Platform Engineering')!.id, userId: userByEmail.get('carol@example.com')!.id, role: 'MEMBER' },
            { teamId: teamByName.get('Payments Operations')!.id, userId: userByEmail.get('erin@example.com')!.id, role: 'OWNER' },
            { teamId: teamByName.get('Payments Operations')!.id, userId: userByEmail.get('bob@example.com')!.id, role: 'MEMBER' },
            { teamId: teamByName.get('Customer Support')!.id, userId: userByEmail.get('frank@example.com')!.id, role: 'OWNER' },
            { teamId: teamByName.get('Customer Support')!.id, userId: userByEmail.get('dave@example.com')!.id, role: 'MEMBER' }
        ],
        skipDuplicates: true
    })

    const policyPlatform = await getOrCreatePolicy('Platform Primary')
    const policyPayments = await getOrCreatePolicy('Payments Escalation')
    const policySupport = await getOrCreatePolicy('Customer Comms')

    await ensurePolicySteps(policyPlatform.id, [
        userByEmail.get('alice@example.com')!.id,
        userByEmail.get('bob@example.com')!.id,
        userByEmail.get('carol@example.com')!.id
    ])
    await ensurePolicySteps(policyPayments.id, [
        userByEmail.get('erin@example.com')!.id,
        userByEmail.get('bob@example.com')!.id,
        userByEmail.get('alice@example.com')!.id
    ])
    await ensurePolicySteps(policySupport.id, [
        userByEmail.get('frank@example.com')!.id,
        userByEmail.get('dave@example.com')!.id
    ])

    const services = await Promise.all([
        getOrCreateService({
            name: 'API Gateway',
            description: 'Main public API entry point',
            status: 'OPERATIONAL',
            teamId: teamByName.get('Platform Engineering')!.id,
            targetAckMinutes: 10,
            targetResolveMinutes: 90
        }),
        getOrCreateService({
            name: 'Auth Service',
            description: 'Authentication and sessions',
            status: 'OPERATIONAL',
            teamId: teamByName.get('Platform Engineering')!.id,
            targetAckMinutes: 15,
            targetResolveMinutes: 120
        }),
        getOrCreateService({
            name: 'Payments API',
            description: 'Payment processing core',
            status: 'DEGRADED',
            teamId: teamByName.get('Payments Operations')!.id,
            targetAckMinutes: 5,
            targetResolveMinutes: 60
        }),
        getOrCreateService({
            name: 'Checkout UI',
            description: 'Customer checkout experience',
            status: 'OPERATIONAL',
            teamId: teamByName.get('Payments Operations')!.id,
            targetAckMinutes: 15,
            targetResolveMinutes: 180
        }),
        getOrCreateService({
            name: 'Customer Comms',
            description: 'Outbound incident communications',
            status: 'OPERATIONAL',
            teamId: teamByName.get('Customer Support')!.id,
            targetAckMinutes: 30,
            targetResolveMinutes: 240
        })
    ])

    const serviceByName = new Map(services.map((service) => [service.name, service]))

    await prisma.service.updateMany({
        where: { id: serviceByName.get('API Gateway')!.id },
        data: { escalationPolicyId: policyPlatform.id }
    })
    await prisma.service.updateMany({
        where: { id: serviceByName.get('Auth Service')!.id },
        data: { escalationPolicyId: policyPlatform.id }
    })
    await prisma.service.updateMany({
        where: { id: serviceByName.get('Payments API')!.id },
        data: { escalationPolicyId: policyPayments.id }
    })
    await prisma.service.updateMany({
        where: { id: serviceByName.get('Checkout UI')!.id },
        data: { escalationPolicyId: policyPayments.id }
    })
    await prisma.service.updateMany({
        where: { id: serviceByName.get('Customer Comms')!.id },
        data: { escalationPolicyId: policySupport.id }
    })

    for (const service of services) {
        const integrationName = `${service.name} Events`
        const existing = await prisma.integration.findFirst({
            where: { name: integrationName, serviceId: service.id }
        })
        if (!existing) {
            await prisma.integration.create({
                data: {
                    name: integrationName,
                    key: makeIntegrationKey(),
                    serviceId: service.id
                }
            })
        }
    }

    const schedules = [
        {
            name: 'Platform Primary',
            team: 'Platform Engineering',
            users: ['alice@example.com', 'bob@example.com', 'carol@example.com']
        },
        {
            name: 'Payments Core',
            team: 'Payments Operations',
            users: ['erin@example.com', 'bob@example.com']
        },
        {
            name: 'Customer Comms',
            team: 'Customer Support',
            users: ['frank@example.com', 'dave@example.com']
        }
    ]

    for (const scheduleSeed of schedules) {
        const existing = await prisma.onCallSchedule.findFirst({
            where: { name: scheduleSeed.name }
        })
        if (!existing) {
            const created = await prisma.onCallSchedule.create({
                data: {
                    name: scheduleSeed.name,
                    timeZone: 'UTC',
                    layers: {
                        create: [
                            {
                                name: `${scheduleSeed.name} Layer 1`,
                                start: daysAgo(30),
                                rotationLengthHours: 24,
                                users: {
                                    create: scheduleSeed.users.map((email, index) => ({
                                        userId: userByEmail.get(email)!.id,
                                        position: index
                                    }))
                                }
                            }
                        ]
                    }
                }
            })
            if (!created) continue
        }
    }

    const scheduleRecords = await prisma.onCallSchedule.findMany({
        include: {
            layers: {
                include: { users: true }
            }
        }
    })

    for (const schedule of scheduleRecords) {
        const existingShiftCount = await prisma.onCallShift.count({
            where: {
                scheduleId: schedule.id,
                start: { gte: daysAgo(30) }
            }
        })
        if (existingShiftCount > 0) continue
        const layer = schedule.layers[0]
        if (!layer || layer.users.length === 0) continue
        const rotationUsers = layer.users.map((layerUser) => layerUser.userId)
        const totalDays = 45
        for (let index = 0; index < totalDays; index += 1) {
            const start = daysAgo(30 - index)
            const end = hoursFrom(start, 24)
            const userId = rotationUsers[index % rotationUsers.length]
            await prisma.onCallShift.create({
                data: {
                    scheduleId: schedule.id,
                    userId,
                    start,
                    end
                }
            })
        }
    }

    const overrideSchedule = await prisma.onCallSchedule.findFirst({
        where: { name: 'Payments Core' }
    })
    if (overrideSchedule) {
        const existingOverride = await prisma.onCallOverride.findFirst({
            where: { scheduleId: overrideSchedule.id }
        })
        if (!existingOverride) {
            await prisma.onCallOverride.create({
                data: {
                    scheduleId: overrideSchedule.id,
                    userId: userByEmail.get('erin@example.com')!.id,
                    replacesUserId: userByEmail.get('bob@example.com')!.id,
                    start: daysAgo(1),
                    end: hoursFrom(daysAgo(1), 12)
                }
            })
        }
    }

    const incidentCount = await prisma.incident.count()
    if (incidentCount === 0) {
        const incidentServices = services
        const assignees = [
            userByEmail.get('alice@example.com')!.id,
            userByEmail.get('bob@example.com')!.id,
            userByEmail.get('carol@example.com')!.id,
            userByEmail.get('erin@example.com')!.id,
            userByEmail.get('frank@example.com')!.id
        ]
        const statuses = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'SNOOZED', 'SUPPRESSED'] as const
        const urgencies = ['HIGH', 'LOW'] as const

        for (let index = 0; index < 45; index += 1) {
            const createdAt = hoursFrom(daysAgo(30 - (index % 28)), Math.floor(Math.random() * 12))
            const status = randomPick(Array.from(statuses))
            const urgency = randomPick(Array.from(urgencies))
            const service = randomPick(incidentServices)
            const assigneeId = Math.random() > 0.2 ? randomPick(assignees) : null
            const resolved = status === 'RESOLVED'
            const updatedAt = resolved ? hoursFrom(createdAt, 1 + Math.floor(Math.random() * 24)) : hoursFrom(createdAt, Math.floor(Math.random() * 12))
            const title = `${service.name} ${urgency === 'HIGH' ? 'Critical' : 'Degraded'} alert #${index + 1}`
            const dedupKey = `demo-${service.id}-${index + 1}`

            const incident = await prisma.incident.create({
                data: {
                    title,
                    description: `Demo incident for ${service.name}`,
                    status,
                    urgency,
                    dedupKey,
                    serviceId: service.id,
                    assigneeId,
                    createdAt,
                    updatedAt
                }
            })

            await prisma.alert.create({
                data: {
                    dedupKey,
                    status: resolved ? 'RESOLVED' : 'TRIGGERED',
                    payload: {
                        summary: title,
                        source: 'demo',
                        severity: urgency === 'HIGH' ? 'critical' : 'warning'
                    },
                    serviceId: service.id,
                    incidentId: incident.id,
                    createdAt
                }
            })

            await prisma.incidentEvent.create({
                data: {
                    incidentId: incident.id,
                    message: `Incident triggered via API from demo seed`,
                    createdAt
                }
            })

            if (assigneeId && Math.random() > 0.3) {
                await prisma.incidentEvent.create({
                    data: {
                        incidentId: incident.id,
                        message: `Acknowledged via API event.`,
                        createdAt: hoursFrom(createdAt, 0.5)
                    }
                })
            }

            if (Math.random() > 0.6) {
                const escalatedTo = randomPick(assignees)
                await prisma.incidentEvent.create({
                    data: {
                        incidentId: incident.id,
                        message: `Escalated to ${userByEmail.get('bob@example.com')!.name} (Level 1)`,
                        createdAt: hoursFrom(createdAt, 1.5)
                    }
                })
            }

            if (resolved) {
                const autoResolved = Math.random() > 0.5
                await prisma.incidentEvent.create({
                    data: {
                        incidentId: incident.id,
                        message: autoResolved ? 'Auto-resolved by event from demo.' : 'Resolved by responder action.',
                        createdAt: updatedAt
                    }
                })
            }

            if (Math.random() > 0.8) {
                await prisma.incidentEvent.create({
                    data: {
                        incidentId: incident.id,
                        message: 'Incident reopened after regression.',
                        createdAt: hoursFrom(updatedAt, 2)
                    }
                })
            }
        }
    }

    console.log('Seed complete. Demo password:', demoPassword)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (error) => {
        console.error(error)
        await prisma.$disconnect()
        process.exit(1)
    })
