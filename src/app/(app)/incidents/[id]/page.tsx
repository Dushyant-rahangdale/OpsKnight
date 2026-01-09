import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getUserPermissions } from '@/lib/rbac';
import {
  addNote,
  addWatcher,
  removeWatcher,
  resolveIncidentWithNote,
  updateIncidentStatus,
  updateIncidentUrgency,
} from '../actions';
import { getPostmortem } from '@/app/(app)/postmortems/actions';
import Link from 'next/link';
import IncidentHeader from '@/components/incident/IncidentHeader';
import IncidentSidebar from '@/components/incident/detail/IncidentSidebar';
import IncidentNotes from '@/components/incident/detail/IncidentNotes';
import IncidentTimeline from '@/components/incident/detail/IncidentTimeline';
import IncidentResolution from '@/components/incident/detail/IncidentResolution';
import IncidentCustomFields from '@/components/IncidentCustomFields';
import { Button } from '@/components/ui/shadcn/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { CheckCircle2, FileText, History, MessageSquare, Settings2 } from 'lucide-react';

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      service: {
        include: {
          policy: true,
        },
      },
      assignee: true,
      team: true,
      events: { orderBy: { createdAt: 'desc' } },
      notes: { include: { user: true }, orderBy: { createdAt: 'desc' } },
      watchers: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      tags: { include: { tag: true }, orderBy: { createdAt: 'asc' } },
      customFieldValues: {
        include: {
          customField: true,
        },
      },
    },
  });

  if (!incident) notFound();

  const [users, teams, customFields] = await Promise.all([
    prisma.user.findMany(),
    prisma.team.findMany(),
    prisma.customField.findMany({ orderBy: { order: 'asc' } }),
  ]);
  const permissions = await getUserPermissions();
  const canManageIncident = permissions.isResponderOrAbove;

  // Check if postmortem exists for this incident
  const postmortem = incident.status === 'RESOLVED' ? await getPostmortem(id) : null;

  // Server actions

  async function handleAddNote(formData: FormData) {
    'use server';
    const content = formData.get('content') as string;
    await addNote(id, content);
  }

  async function handleAcknowledge() {
    'use server';
    await updateIncidentStatus(id, 'ACKNOWLEDGED');
  }

  async function handleUnacknowledge() {
    'use server';
    await updateIncidentStatus(id, 'OPEN');
  }

  async function handleSnooze() {
    'use server';
    await updateIncidentStatus(id, 'SNOOZED');
  }

  async function handleSuppress() {
    'use server';
    await updateIncidentStatus(id, 'SUPPRESSED');
  }

  async function handleUnsnooze() {
    'use server';
    await updateIncidentStatus(id, 'OPEN');
  }

  async function handleUnsuppress() {
    'use server';
    await updateIncidentStatus(id, 'OPEN');
  }

  async function handleResolve(formData: FormData) {
    'use server';
    const resolution = (formData.get('resolution') as string) || '';
    await resolveIncidentWithNote(id, resolution);
  }

  async function _handleUrgencyChange(formData: FormData) {
    'use server';
    const newUrgency = formData.get('urgency') as string;
    await updateIncidentUrgency(id, newUrgency);
  }

  async function handleAddWatcher(formData: FormData) {
    'use server';
    const watcherId = formData.get('watcherId') as string;
    const role = formData.get('watcherRole') as string;
    await addWatcher(id, watcherId, role);
  }

  async function handleRemoveWatcher(formData: FormData) {
    'use server';
    const watcherId = formData.get('watcherMemberId') as string;
    await removeWatcher(id, watcherId);
  }

  return (
    <main className="w-full mx-auto px-4 md:px-6 py-6 max-w-[1600px] bg-neutral-50 min-h-screen">
      {/* Header */}
      <IncidentHeader
        incident={incident as any} // eslint-disable-line @typescript-eslint/no-explicit-any
        users={users}
        teams={teams}
        canManage={canManageIncident}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 mt-6">
        {/* Main Content */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <Tabs defaultValue="overview" className="w-full">
              <div className="border-b border-neutral-200 px-6">
                <TabsList className="h-12 bg-transparent p-0 gap-0">
                  <TabsTrigger
                    value="overview"
                    className="relative h-12 px-4 rounded-none border-b-2 border-transparent text-neutral-500 font-medium data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-neutral-900 transition-colors"
                  >
                    <Settings2 className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="timeline"
                    className="relative h-12 px-4 rounded-none border-b-2 border-transparent text-neutral-500 font-medium data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-neutral-900 transition-colors"
                  >
                    <History className="h-4 w-4 mr-2" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger
                    value="activity"
                    className="relative h-12 px-4 rounded-none border-b-2 border-transparent text-neutral-500 font-medium data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-neutral-900 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Activity
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="overview" className="mt-0 space-y-6">
                  {/* Resolution Form */}
                  {incident.status !== 'RESOLVED' && (
                    <IncidentResolution
                      incidentId={incident.id}
                      canManage={canManageIncident}
                      onResolve={handleResolve}
                    />
                  )}

                  {/* Postmortem Section */}
                  {incident.status === 'RESOLVED' && (
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-green-700" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-900">Postmortem</h4>
                            <p className="text-sm text-neutral-500 mt-0.5">
                              Document lessons learned for this resolved incident.
                            </p>
                          </div>
                        </div>

                        {postmortem ? (
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                              <CheckCircle2 className="h-4 w-4" />
                              Filed
                            </span>
                            <Link href={`/postmortems/${id}`}>
                              <Button variant="outline" size="sm">
                                View Report
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <Link href={`/postmortems/${id}`}>
                            <Button size="sm">Create Postmortem</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom Fields */}
                  <div className="rounded-lg border border-neutral-200 bg-white p-5">
                    <h4 className="text-sm font-semibold text-neutral-900 mb-4">Custom Fields</h4>
                    <IncidentCustomFields
                      incidentId={id}
                      customFieldValues={
                        incident.customFieldValues?.map(v => ({
                          id: v.id,
                          value: v.value,
                          customField: v.customField,
                        })) || []
                      }
                      allCustomFields={customFields}
                      canManage={canManageIncident}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="mt-0">
                  <IncidentTimeline
                    events={incident.events.map(e => ({
                      id: e.id,
                      message: e.message,
                      createdAt: e.createdAt,
                    }))}
                    incidentCreatedAt={incident.createdAt}
                    incidentAcknowledgedAt={incident.acknowledgedAt}
                    incidentResolvedAt={incident.resolvedAt}
                  />
                </TabsContent>

                <TabsContent value="activity" className="mt-0">
                  <IncidentNotes
                    notes={incident.notes.map(n => ({
                      id: n.id,
                      content: n.content,
                      user: n.user,
                      createdAt: n.createdAt,
                    }))}
                    canManage={canManageIncident}
                    onAddNote={handleAddNote}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-6 h-fit">
          <IncidentSidebar
            incident={{
              id: incident.id,
              status: incident.status,
              assigneeId: incident.assigneeId,
              assignee: incident.assignee,
              service: incident.service,
              acknowledgedAt: incident.acknowledgedAt,
              resolvedAt: incident.resolvedAt,
              createdAt: incident.createdAt,
              escalationStatus: incident.escalationStatus,
              currentEscalationStep: incident.currentEscalationStep,
              nextEscalationAt: incident.nextEscalationAt,
            }}
            users={users}
            watchers={incident.watchers.map(w => ({
              id: w.id,
              user: w.user,
              role: w.role,
            }))}
            tags={incident.tags.map(t => ({
              id: t.tag.id,
              name: t.tag.name,
              color: t.tag.color,
            }))}
            canManage={canManageIncident}
            onAcknowledge={handleAcknowledge}
            onUnacknowledge={handleUnacknowledge}
            onSnooze={handleSnooze}
            onUnsnooze={handleUnsnooze}
            onSuppress={handleSuppress}
            onUnsuppress={handleUnsuppress}
            onAddWatcher={handleAddWatcher}
            onRemoveWatcher={handleRemoveWatcher}
          />
        </aside>
      </div>
    </main>
  );
}
