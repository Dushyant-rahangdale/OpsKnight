import { getUserPermissions } from '@/lib/rbac';
import { redirect } from 'next/navigation';
import NotificationHistory from '@/components/settings/NotificationHistory';

export default async function NotificationHistoryPage() {
    const permissions = await getUserPermissions();
    
    if (!permissions) {
        redirect('/login');
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    Notification Status & History
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                    View your notification delivery history, status, and track delivery metrics
                </p>
            </div>

            <NotificationHistory />
        </div>
    );
}

