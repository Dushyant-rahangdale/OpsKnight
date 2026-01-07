import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { assertResponderOrAbove, getUserPermissions } from '@/lib/rbac';
import { getAccessiblePresets } from '@/lib/search-presets';
import prisma from '@/lib/prisma';
import SearchPresetManager from '@/components/SearchPresetManager';
import { SettingsPageHeader } from '@/components/settings/layout/SettingsPageHeader';
import { SettingsSection } from '@/components/settings/layout/SettingsSection';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Search, Info, Activity } from 'lucide-react';

export default async function SearchPresetsPage() {
  const session = await getServerSession(await getAuthOptions());
  if (!session) {
    redirect('/login');
  }

  try {
    await assertResponderOrAbove();
  } catch {
    redirect('/');
  }

  const permissions = await getUserPermissions();

  // Get user's teams
  const userTeams = await prisma.user.findUnique({
    where: { id: permissions.id },
    select: {
      teamMemberships: {
        select: {
          teamId: true,
        },
      },
    },
  });

  const userTeamIds = userTeams?.teamMemberships.map(t => t.teamId) || [];

  const [presets, services, users, teams] = await Promise.all([
    getAccessiblePresets(permissions.id, userTeamIds),
    prisma.service.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    prisma.team.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const personalPresets = presets.filter(p => !p.isShared && !p.isPublic);
  const teamPresets = presets.filter(p => p.isShared && !p.isPublic);
  const globalPresets = presets.filter(p => p.isPublic);

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Search Presets"
        description="Create and manage saved search filters for quick access to incidents."
        backHref="/settings"
        backLabel="Back to Settings"
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'Search Presets', href: '/settings/search-presets' },
        ]}
      />

      {/* Overview Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Search Presets</CardTitle>
              <CardDescription className="mt-2 text-base">
                Save commonly used search filters to quickly access specific incident views. Create
                personal presets or share them with your team for collaboration.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Info Card */}
            <div className="p-4 rounded-lg border border-border bg-background">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Quick Access</span>
                </div>
                <p className="font-semibold">Reusable Filters</p>
                <p className="text-sm text-muted-foreground">
                  Save complex search criteria and apply them instantly to any incident view
                </p>
              </div>
            </div>

            {/* Status Card */}
            <div className="p-4 rounded-lg border border-border bg-background">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Your Presets</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Personal</span>
                    <Badge variant="default">{personalPresets.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Team Shared</span>
                    <Badge variant="default">{teamPresets.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Global</span>
                    <Badge variant="secondary">{globalPresets.length}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Searches Section */}
      <SettingsSection
        title="Saved Searches"
        description="Build filters you can reuse across incident views"
        action={
          <div className="flex gap-2">
            <Badge variant="outline">Personal</Badge>
            <Badge variant="outline">Team-shared</Badge>
            <Badge variant="outline">Global</Badge>
          </div>
        }
        footer={
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Sharing presets</p>
              <p className="text-sm text-muted-foreground">
                Personal presets are private. Team presets are visible to team members. Global
                presets are visible to everyone.
              </p>
            </div>
          </div>
        }
      >
        <div className="py-4">
          <SearchPresetManager
            presets={presets}
            services={services}
            users={users}
            teams={teams}
            currentUserId={permissions.id}
            isAdmin={permissions.isAdmin}
          />
        </div>
      </SettingsSection>
    </div>
  );
}
