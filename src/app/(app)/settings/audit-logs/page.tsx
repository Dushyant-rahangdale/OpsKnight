import SettingsPage from '@/components/settings/SettingsPage';
import SettingsSectionCard from '@/components/settings/SettingsSectionCard';
import SettingsEmptyState from '@/components/settings/SettingsEmptyState';

export default function AuditLogsSettingsPage() {
    return (
        <SettingsPage
            backHref="/settings"
            title="Audit Logs"
            description="Track critical configuration changes across the workspace."
        >
            <SettingsSectionCard
                title="Recent activity"
                description="Review configuration updates and access changes."
            >
                <SettingsEmptyState
                    title="No audit logs available"
                    description="Audit logging will appear here once activity is tracked."
                />
            </SettingsSectionCard>
        </SettingsPage>
    );
}

