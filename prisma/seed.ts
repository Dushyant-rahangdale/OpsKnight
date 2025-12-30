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
    { email: 'frank@example.com', name: 'Frank Support', role: 'RESPONDER' },
    { email: 'gina@example.com', name: 'Gina Reliability', role: 'RESPONDER' },
    { email: 'hank@example.com', name: 'Hank Systems', role: 'RESPONDER' },
    { email: 'ivy@example.com', name: 'Ivy Platform', role: 'RESPONDER' },
    { email: 'jake@example.com', name: 'Jake Engineer', role: 'RESPONDER' },
    { email: 'kira@example.com', name: 'Kira Infra', role: 'RESPONDER' },
    { email: 'liam@example.com', name: 'Liam Ops', role: 'RESPONDER' },
    { email: 'mona@example.com', name: 'Mona Support', role: 'RESPONDER' },
    { email: 'nate@example.com', name: 'Nate Backend', role: 'RESPONDER' },
    { email: 'olga@example.com', name: 'Olga SRE', role: 'RESPONDER' },
    { email: 'pete@example.com', name: 'Pete Platform', role: 'RESPONDER' },
    { email: 'quinn@example.com', name: 'Quinn Ops', role: 'RESPONDER' },
    { email: 'ruth@example.com', name: 'Ruth Infra', role: 'RESPONDER' },
    { email: 'sam@example.com', name: 'Sam Reliability', role: 'RESPONDER' },
    { email: 'tina@example.com', name: 'Tina Ops', role: 'RESPONDER' },
    { email: 'uma@example.com', name: 'Uma Support', role: 'RESPONDER' },
    { email: 'vic@example.com', name: 'Vic Systems', role: 'RESPONDER' },
    { email: 'walt@example.com', name: 'Walt Oncall', role: 'RESPONDER' },
    { email: 'xena@example.com', name: 'Xena Ops', role: 'RESPONDER' },
    { email: 'yuri@example.com', name: 'Yuri Platform', role: 'RESPONDER' },
    { email: 'zoe@example.com', name: 'Zoe Support', role: 'RESPONDER' },
    { email: 'aaron@example.com', name: 'Aaron Dev', role: 'USER' },
    { email: 'bianca@example.com', name: 'Bianca Analyst', role: 'USER' },
    { email: 'cody@example.com', name: 'Cody Reporter', role: 'USER' },
    { email: 'dina@example.com', name: 'Dina Insights', role: 'USER' },
    { email: 'elliot@example.com', name: 'Elliot QA', role: 'USER' }
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

function randomInt(max: number) {
    return Math.floor(Math.random() * max)
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
        targetType: 'USER' as const,
        targetUserId: userId,
        targetTeamId: null,
        targetScheduleId: null,
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
    const userNameById = new Map(users.map((user) => [user.id, user.name || user.email]))
    const roleByEmail = new Map(userSeeds.map((user) => [user.email, user.role]))

    const responderIds = users
        .filter((user) => roleByEmail.get(user.email) !== 'USER')
        .map((user) => user.id)

    await prisma.teamMember.createMany({
        data: [
            { teamId: teamByName.get('Platform Engineering')!.id, userId: userByEmail.get('alice@example.com')!.id, role: 'OWNER' },
            { teamId: teamByName.get('Platform Engineering')!.id, userId: userByEmail.get('bob@example.com')!.id, role: 'ADMIN' },
            { teamId: teamByName.get('Platform Engineering')!.id, userId: userByEmail.get('carol@example.com')!.id, role: 'MEMBER' },
            { teamId: teamByName.get('Platform Engineering')!.id, userId: userByEmail.get('gina@example.com')!.id, role: 'MEMBER' },
            { teamId: teamByName.get('Platform Engineering')!.id, userId: userByEmail.get('hank@example.com')!.id, role: 'MEMBER' },
            { teamId: teamByName.get('Platform Engineering')!.id, userId: userByEmail.get('ivy@example.com')!.id, role: 'MEMBER' },
            { teamId: teamByName.get('Payments Operations')!.id, userId: userByEmail.get('erin@example.com')!.id, role: 'OWNER' },
            { teamId: teamByName.get('Payments Operations')!.id, userId: userByEmail.get('bob@example.com')!.id, role: 'MEMBER' },
            { teamId: teamByName.get('Payments Operations')!.id, userId: userByEmail.get('jake@example.com')!.id, role: 'MEMBER' },
            { teamId: teamByName.get('Payments Operations')!.id, userId: userByEmail.get('kira@example.com')!.id, role: 'MEMBER' },
            { teamId: teamByName.get('Customer Support')!.id, userId: userByEmail.get('frank@example.com')!.id, role: 'OWNER' },
            { teamId: teamByName.get('Customer Support')!.id, userId: userByEmail.get('dave@example.com')!.id, role: 'MEMBER' },
            { teamId: teamByName.get('Customer Support')!.id, userId: userByEmail.get('mona@example.com')!.id, role: 'MEMBER' },
            { teamId: teamByName.get('Customer Support')!.id, userId: userByEmail.get('uma@example.com')!.id, role: 'MEMBER' }
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

    const forceDemo = process.env.DEMO_FORCE === '1'
    const existingDemoIncidents = await prisma.incident.count({
        where: { dedupKey: { startsWith: 'demo-' } }
    })
    const _incidentCount = await prisma.incident.count()
    // Always seed if forceDemo is true, or if we have less than 300 demo incidents
    const shouldSeedIncidents = forceDemo || existingDemoIncidents < 300

    if (shouldSeedIncidents) {
        const incidentServices = services
        const assignees = responderIds.length ? responderIds : [
            userByEmail.get('alice@example.com')!.id,
            userByEmail.get('bob@example.com')!.id,
            userByEmail.get('carol@example.com')!.id,
            userByEmail.get('erin@example.com')!.id,
            userByEmail.get('frank@example.com')!.id
        ]
        const statuses = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'SNOOZED', 'SUPPRESSED'] as const
        const urgencies = ['HIGH', 'LOW'] as const
        const priorities = ['P1', 'P2', 'P3', 'P4', 'P5', null] as const
        const incidentTitles = [
            'Database connection pool exhausted',
            'API latency spike detected',
            'Memory leak in service worker',
            'Failed payment processing',
            'Certificate expiration warning',
            'Disk space critical on production',
            'Cache miss rate increased',
            'Third-party API timeout',
            'High error rate in microservice',
            'Queue processing backlog',
            'DNS resolution failure',
            'SSL handshake timeout',
            'Database query performance degradation',
            'Message queue consumer lag',
            'CDN cache invalidation issue',
            'Load balancer health check failures',
            'Redis connection timeout',
            'Elasticsearch cluster unresponsive',
            'Kubernetes pod crash loop',
            'Network partition detected',
            'Storage quota exceeded',
            'Authentication service outage',
            'Data replication lag',
            'GraphQL query timeout',
            'WebSocket connection drops',
            'Cron job execution failure',
            'Backup job failed',
            'Monitoring system unreachable',
            'Log aggregation delay',
            'Service mesh routing issue'
        ]

        const totalIncidents = 500
        console.log(`Creating ${totalIncidents} demo incidents...`)

        for (let index = 0; index < totalIncidents; index += 1) {
            const createdAt = hoursFrom(daysAgo(randomInt(180)), randomInt(48)) // Up to 180 days ago
            const status = randomPick(Array.from(statuses))
            const urgency = randomPick(Array.from(urgencies))
            const priority = Math.random() > 0.3 ? randomPick(Array.from(priorities)) : null // 70% have priority
            const service = randomPick(incidentServices)
            const assigneeId = Math.random() > 0.15 ? randomPick(assignees) : null // 85% assigned
            const resolved = status === 'RESOLVED'
            const acknowledged = status === 'ACKNOWLEDGED' || resolved
            const snoozed = status === 'SNOOZED'
            
            // Calculate timestamps based on status
            let acknowledgedAt: Date | null = null
            let resolvedAt: Date | null = null
            let snoozedUntil: Date | null = null
            let updatedAt: Date

            if (acknowledged) {
                const ackDelayMinutes = Math.floor(Math.random() * 120) + 5 // 5-125 minutes after creation
                acknowledgedAt = new Date(createdAt.getTime() + ackDelayMinutes * 60 * 1000)
            }

            if (resolved) {
                const resolveDelayHours = Math.floor(Math.random() * 72) + 1 // 1-72 hours after creation
                resolvedAt = new Date(createdAt.getTime() + resolveDelayHours * 60 * 60 * 1000)
                updatedAt = resolvedAt
            } else if (snoozed) {
                const snoozeHours = [1, 4, 8, 24, 48][randomInt(5)] // 1, 4, 8, 24, or 48 hours
                snoozedUntil = new Date(createdAt.getTime() + snoozeHours * 60 * 60 * 1000)
                updatedAt = hoursFrom(createdAt, Math.floor(Math.random() * 12))
            } else {
                updatedAt = hoursFrom(createdAt, Math.floor(Math.random() * 48))
            }

            // Generate varied incident titles
            const titleTemplate = randomPick(incidentTitles)
            const title = `${service.name}: ${titleTemplate}${index > 0 ? ` (${index + 1})` : ''}`
            const dedupKey = `demo-${service.id}-${index + 1}-${Date.now()}`
            
            // Check if this specific incident already exists (by dedupKey)
            const alreadyExists = await prisma.incident.findFirst({
                where: { dedupKey }
            })
            if (alreadyExists) {
                continue
            }

            const incident = await prisma.incident.create({
                data: {
                    title,
                    description: `Demo incident for ${service.name}. ${urgency === 'HIGH' ? 'High priority issue requiring immediate attention.' : 'Lower priority issue for follow-up.'}${priority ? ` Priority level: ${priority}.` : ''}`,
                    status,
                    urgency,
                    priority,
                    dedupKey,
                    serviceId: service.id,
                    assigneeId,
                    acknowledgedAt,
                    resolvedAt,
                    snoozedUntil,
                    snoozeReason: snoozed ? 'Demo data: Auto-snoozed for testing' : null,
                    createdAt,
                    updatedAt,
                    // Set escalation status based on incident status
                    escalationStatus: resolved || acknowledged ? 'COMPLETED' : (snoozed || status === 'SUPPRESSED' ? 'PAUSED' : 'ESCALATING'),
                    nextEscalationAt: resolved || acknowledged || snoozed || status === 'SUPPRESSED' ? null : hoursFrom(createdAt, 15 + randomInt(30))
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

            // Add acknowledgment event if acknowledged
            if (acknowledged && acknowledgedAt) {
                const ackUserName = assigneeId ? userNameById.get(assigneeId) || 'Responder' : 'System'
                await prisma.incidentEvent.create({
                    data: {
                        incidentId: incident.id,
                        message: `Incident acknowledged by ${ackUserName}`,
                        createdAt: acknowledgedAt
                    }
                })
            }

            // Add escalation events (for some incidents)
            if (!resolved && !acknowledged && Math.random() > 0.5) {
                const escalatedTo = randomPick(assignees)
                const escalatedName = userNameById.get(escalatedTo) || 'Responder'
                await prisma.incidentEvent.create({
                    data: {
                        incidentId: incident.id,
                        message: `Escalated to ${escalatedName} (Level ${1 + randomInt(3)})`,
                        createdAt: hoursFrom(createdAt, 1 + randomInt(4))
                    }
                })
            }

            // Add resolution event if resolved
            if (resolved && resolvedAt) {
                const resolverName = assigneeId ? userNameById.get(assigneeId) || 'Responder' : 'System'
                const resolutionMethods = [
                    'Resolved by responder action',
                    'Auto-resolved after monitoring check passed',
                    'Resolved via automated remediation',
                    'Manually resolved after investigation',
                    'Resolved after service restart'
                ]
                await prisma.incidentEvent.create({
                    data: {
                        incidentId: incident.id,
                        message: `${randomPick(resolutionMethods)} by ${resolverName}`,
                        createdAt: resolvedAt
                    }
                })
            }

            // Add snooze event if snoozed
            if (snoozed && snoozedUntil) {
                const snoozeReasons = [
                    'Snoozed for maintenance window',
                    'Snoozed pending investigation',
                    'Snoozed - false positive expected',
                    'Snoozed until next business day'
                ]
                await prisma.incidentEvent.create({
                    data: {
                        incidentId: incident.id,
                        message: `${randomPick(snoozeReasons)} (until ${snoozedUntil.toLocaleString()})`,
                        createdAt: createdAt
                    }
                })
            }

            // Add some notes for a portion of incidents
            if (Math.random() > 0.7) {
                const noteContents = [
                    'Investigating root cause. Initial assessment suggests network connectivity issue.',
                    'Working with vendor to resolve third-party service outage.',
                    'Monitoring metrics show gradual improvement. Continuing to observe.',
                    'Applied hotfix. Monitoring for stability.',
                    'Rolled back recent deployment. Incident appears to be resolved.',
                    'Identified configuration error. Fix in progress.',
                    'Scaling up resources to handle increased load.',
                    'Database query optimization applied. Performance improving.',
                    'Cache cleared. Service recovery in progress.',
                    'Implemented circuit breaker pattern. Error rate decreasing.'
                ]
                const noteAuthor = randomPick(assignees)
                await prisma.incidentNote.create({
                    data: {
                        incidentId: incident.id,
                        userId: noteAuthor,
                        content: randomPick(noteContents),
                        createdAt: hoursFrom(createdAt, Math.random() * 24)
                    }
                })
            }

            // Add watchers for some incidents
            if (Math.random() > 0.8 && assigneeId) {
                const watcherIds = assignees.filter(id => id !== assigneeId).slice(0, randomInt(3) + 1)
                for (const watcherId of watcherIds) {
                    await prisma.incidentWatcher.create({
                        data: {
                            incidentId: incident.id,
                            userId: watcherId,
                            role: 'FOLLOWER',
                            createdAt: hoursFrom(createdAt, Math.random() * 6)
                        }
                    }).catch(() => {}) // Ignore duplicate watcher errors
                }
            }

            // Progress indicator every 50 incidents
            if ((index + 1) % 50 === 0) {
                console.log(`  Created ${index + 1}/${totalIncidents} incidents...`)
            }
        }
        
        console.log(`✓ Created ${totalIncidents} demo incidents successfully`)
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
