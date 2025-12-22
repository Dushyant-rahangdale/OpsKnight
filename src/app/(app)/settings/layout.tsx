import SettingsNav from '@/components/settings/SettingsNav';
import { getUserPermissions } from '@/lib/rbac';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
    const permissions = await getUserPermissions();
    
    return (
        <main className="settings-shell">
            <header className="settings-header">
                <h1>Settings</h1>
                <p>Manage your account preferences, security, and system configuration.</p>
            </header>
            <div className="settings-grid">
                <SettingsNav isAdmin={permissions.isAdmin} />
                <section className="settings-content">
                    {children}
                </section>
            </div>
        </main>
    );
}
