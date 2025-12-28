import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { assertAdmin } from '@/lib/rbac';
import prisma from '@/lib/prisma';
import StatusPageSubscribers from '@/components/status-page/StatusPageSubscribers';
import StatusPageEmailConfig from '@/components/status-page/StatusPageEmailConfig';
import SettingsPage from '@/components/settings/SettingsPage';
import SettingsSectionCard from '@/components/settings/SettingsSectionCard';

export default async function StatusPageSubscribersPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect('/login');
    }

    try {
        await assertAdmin();
    } catch {
        redirect('/');
    }

    // Get status page
    const statusPage = await prisma.statusPage.findFirst({
        where: { enabled: true },
    });

    if (!statusPage) {
        redirect('/settings/status-page');
    }

    return (
        <SettingsPage
            backHref="/settings"
            title="Status Page Subscribers"
            description="Manage email subscribers and configure notification settings."
        >
            <SettingsSectionCard
                title="Email delivery"
                description="Choose the email provider used for subscription updates."
            >
                <StatusPageEmailConfig
                    statusPageId={statusPage.id}
                    currentProvider={statusPage.emailProvider}
                />
            </SettingsSectionCard>

            <SettingsSectionCard
                title="Subscribers"
                description="Manage subscriber list and verification status."
            >
                <StatusPageSubscribers statusPageId={statusPage.id} />
            </SettingsSectionCard>
        </SettingsPage>
    );
}

