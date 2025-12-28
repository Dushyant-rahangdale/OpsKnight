import { getUserPermissions } from '@/lib/rbac';
import { redirect } from 'next/navigation';
import SettingsPage from '@/components/settings/SettingsPage';
import SettingsSectionCard from '@/components/settings/SettingsSectionCard';
import NotificationProviderSettings from '@/components/settings/NotificationProviderSettings';

export default async function NotificationProviderSettingsPage() {
    const permissions = await getUserPermissions();
    
    if (!permissions.isAdmin) {
        redirect('/settings');
    }

    return (
        <SettingsPage
            backHref="/settings"
            title="Notification Providers"
            description="Configure SMS, push, and WhatsApp notification providers for your organization."
        >
            <SettingsSectionCard
                title="Provider configuration"
                description="Manage outbound providers and test delivery channels."
            >
                <NotificationProviderSettings />
            </SettingsSectionCard>
        </SettingsPage>
    );
}


