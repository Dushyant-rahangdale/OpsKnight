import prisma from './prisma';

export type SMSProvider = 'twilio' | 'aws-sns' | null;
export type PushProvider = 'firebase' | 'onesignal' | null;

export interface SMSConfig {
    enabled: boolean;
    provider: SMSProvider;
    // Twilio config
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
    whatsappNumber?: string; // WhatsApp Business API number (optional)
    // AWS SNS config
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
}

export interface PushConfig {
    enabled: boolean;
    provider: PushProvider;
    // Firebase config
    projectId?: string;
    privateKey?: string;
    clientEmail?: string;
    // OneSignal config
    appId?: string;
    restApiKey?: string;
}

export type EmailProvider = 'resend' | 'sendgrid' | 'smtp' | null;

export interface EmailConfig {
    enabled: boolean;
    provider: EmailProvider;
    apiKey?: string;
    fromEmail?: string;
    source?: string;
    host?: string;
}

export type NotificationChannelType = 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP';

export async function getEmailConfig(): Promise<EmailConfig> {
    const defaultFromEmail = `noreply@${process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'opsguard.com'}`;

    try {
        // Check Resend first
        const resendProvider = await prisma.notificationProvider.findUnique({
            where: { provider: 'resend' }
        });

        if (resendProvider && resendProvider.enabled && resendProvider.config) {
            const config = resendProvider.config as any;
            if (config.apiKey) {
                return {
                    enabled: true,
                    provider: 'resend',
                    apiKey: config.apiKey,
                    fromEmail: config.fromEmail || defaultFromEmail,
                    source: 'resend'
                };
            }
        }

        // Check SendGrid
        const sendgridProvider = await prisma.notificationProvider.findUnique({
            where: { provider: 'sendgrid' }
        });

        if (sendgridProvider && sendgridProvider.enabled && sendgridProvider.config) {
            const config = sendgridProvider.config as any;
            if (config.apiKey) {
                return {
                    enabled: true,
                    provider: 'sendgrid',
                    apiKey: config.apiKey,
                    fromEmail: config.fromEmail || defaultFromEmail,
                    source: 'sendgrid'
                };
            }
        }

        // Check SMTP
        const smtpProvider = await prisma.notificationProvider.findUnique({
            where: { provider: 'smtp' }
        });

        if (smtpProvider && smtpProvider.enabled && smtpProvider.config) {
            const config = smtpProvider.config as any;
            if (config.host && config.user && config.password) {
                return {
                    enabled: true,
                    provider: 'smtp',
                    apiKey: config.password,
                    fromEmail: config.fromEmail || defaultFromEmail,
                    source: 'smtp',
                    host: config.host
                };
            }
        }
    } catch (error) {
        console.error('Failed to load Email config from database:', error);
    }

    return {
        enabled: false,
        provider: null
    };
}

export async function isChannelAvailable(channel: NotificationChannelType): Promise<boolean> {
    switch (channel) {
        case 'EMAIL':
            return (await getEmailConfig()).enabled;
        case 'SMS':
            return (await getSMSConfig()).enabled;
        case 'PUSH':
            return (await getPushConfig()).enabled;
        case 'WHATSAPP':
            // WhatsApp requires Twilio with WhatsApp Business API
            const smsConfig = await getSMSConfig();
            return smsConfig.enabled && smsConfig.provider === 'twilio';
        default:
            return false;
    }
}

/**
 * Get SMS configuration from database only
 */
export async function getSMSConfig(): Promise<SMSConfig> {
    try {
        const twilioProvider = await prisma.notificationProvider.findUnique({
            where: { provider: 'twilio' }
        });

        if (twilioProvider && twilioProvider.enabled && twilioProvider.config) {
            const config = twilioProvider.config as any;
            if (config.accountSid && config.authToken) {
                return {
                    enabled: true,
                    provider: 'twilio',
                    accountSid: config.accountSid,
                    authToken: config.authToken,
                    fromNumber: config.fromNumber,
                    whatsappNumber: config.whatsappNumber,
                };
            }
        }

        const awsProvider = await prisma.notificationProvider.findUnique({
            where: { provider: 'aws-sns' }
        });

        if (awsProvider && awsProvider.enabled && awsProvider.config) {
            const config = awsProvider.config as any;
            if (config.accessKeyId && config.secretAccessKey) {
                return {
                    enabled: true,
                    provider: 'aws-sns',
                    region: config.region || 'us-east-1',
                    accessKeyId: config.accessKeyId,
                    secretAccessKey: config.secretAccessKey,
                };
            }
        }
    } catch (error) {
        console.error('Failed to load SMS config from database:', error);
    }

    return {
        enabled: false,
        provider: null,
    };
}

/**
 * Get Push notification configuration from database only
 */
export async function getPushConfig(): Promise<PushConfig> {
    try {
        const firebaseProvider = await prisma.notificationProvider.findUnique({
            where: { provider: 'firebase' }
        });

        if (firebaseProvider && firebaseProvider.enabled && firebaseProvider.config) {
            const config = firebaseProvider.config as any;
            if (config.projectId && config.privateKey) {
                return {
                    enabled: true,
                    provider: 'firebase',
                    projectId: config.projectId,
                    privateKey: config.privateKey,
                    clientEmail: config.clientEmail,
                };
            }
        }

        const onesignalProvider = await prisma.notificationProvider.findUnique({
            where: { provider: 'onesignal' }
        });

        if (onesignalProvider && onesignalProvider.enabled && onesignalProvider.config) {
            const config = onesignalProvider.config as any;
            if (config.appId && config.restApiKey) {
                return {
                    enabled: true,
                    provider: 'onesignal',
                    appId: config.appId,
                    restApiKey: config.restApiKey,
                };
            }
        }
    } catch (error) {
        console.error('Failed to load Push config from database:', error);
    }

    return {
        enabled: false,
        provider: null,
    };
}
