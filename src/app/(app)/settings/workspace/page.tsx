import SettingsPage from '@/components/settings/SettingsPage';
import SettingsSectionCard from '@/components/settings/SettingsSectionCard';
import SettingsEmptyState from '@/components/settings/SettingsEmptyState';

export default function WorkspaceSettingsPage() {
    return (
        <SettingsPage
            backHref="/settings"
            title="Workspace"
            description="Manage organization details and team access."
        >
            <SettingsSectionCard
                title="Workspace profile"
                description="Organization name, branding, and defaults."
            >
                <SettingsEmptyState
                    title="Workspace profile coming soon"
                    description="This section will surface organization details once configured."
                />
            </SettingsSectionCard>

            <SettingsSectionCard
                title="Members"
                description="Invite and manage workspace members."
            >
                <SettingsEmptyState
                    title="Members are managed elsewhere"
                    description="Use the Users or Teams pages to manage access."
                />
            </SettingsSectionCard>
        </SettingsPage>
    );
}

