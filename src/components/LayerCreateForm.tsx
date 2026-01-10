'use client';

export default function LayerCreateForm({
  scheduleId,
  canManageSchedules,
  createLayer,
  defaultStartDate,
}: any) {
  if (!canManageSchedules) return null;

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground">
      <h3 className="font-medium mb-2">Add New Layer</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Define a new rotation layer for this schedule.
      </p>
      <button
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
        disabled
      >
        Create Layer implementation pending...
      </button>
    </div>
  );
}
