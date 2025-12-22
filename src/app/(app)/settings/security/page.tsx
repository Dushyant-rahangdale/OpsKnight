import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import SecurityForm from '@/components/settings/SecurityForm';
import SettingsSection from '@/components/settings/SettingsSection';

export default async function SecuritySettingsPage() {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    const user = email
        ? await prisma.user.findUnique({
            where: { email },
            select: { passwordHash: true, updatedAt: true }
        })
        : null;
    const ssoEnabled = Boolean(process.env.OIDC_ISSUER);
    const hasPassword = Boolean(user?.passwordHash);

    return (
        <SettingsSection
            title="Security"
            description="Control how you sign in and monitor account activity."
        >

            <div className="settings-panel">
                <div className="settings-row">
                    <div>
                        <h3>Single sign-on</h3>
                        <p>Authenticate with your identity provider.</p>
                    </div>
                    <span className={`settings-badge ${ssoEnabled ? 'on' : 'off'}`}>
                        {ssoEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                </div>

                <div className="settings-row">
                    <div>
                        <h3>Password</h3>
                        <p>Use a local password when SSO is unavailable.</p>
                    </div>
                    <span className={`settings-badge ${hasPassword ? 'on' : 'off'}`}>
                        {hasPassword ? 'Set' : 'Not set'}
                    </span>
                </div>

                <div className="settings-row">
                    <div>
                        <h3>Last updated</h3>
                        <p>{user?.updatedAt ? user.updatedAt.toLocaleString() : 'No recent changes'}</p>
                    </div>
                </div>

            </div>

            <SecurityForm hasPassword={hasPassword} />
            <div className="settings-note" style={{ marginTop: '1.5rem' }}>
                For password resets or session issues, contact your OpsGuard administrator.
            </div>
        </SettingsSection>
    );
}
