'use client';

import { AutosaveForm } from '@/components/settings/forms/AutosaveForm';
import { SettingsRow } from '@/components/settings/layout/SettingsRow';
import TimeZoneSelect from '@/components/TimeZoneSelect';
import { z } from 'zod';
import { updatePreferences } from '@/app/(app)/settings/actions';
import { useRouter } from 'next/navigation';

type Props = {
  timeZone: string;
};

// Schema for preferences
const preferencesSchema = z.object({
  timeZone: z.string(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

export default function PreferencesForm({ timeZone }: Props) {
  const router = useRouter();

  const defaultValues: PreferencesFormData = {
    timeZone,
  };

  const handleSave = async (data: PreferencesFormData) => {
    // Convert to FormData to call the server action
    const formData = new FormData();
    formData.append('timeZone', data.timeZone);

    const result = await updatePreferences({ error: null, success: false }, formData);

    // Refresh the page after successful update
    if (result.success) {
      setTimeout(() => {
        router.refresh();
      }, 1000);
    }

    return {
      success: result.success ?? false,
      error: result.error ?? undefined,
    };
  };

  return (
    <AutosaveForm
      defaultValues={defaultValues}
      schema={preferencesSchema}
      onSave={handleSave}
      showSaveIndicator={true}
      saveIndicatorPosition="top-right"
      delay={500}
    >
      {form => (
        <div className="divide-y">
          <SettingsRow
            label="Timezone"
            description="All times are displayed in your selected timezone"
            htmlFor="timeZone"
          >
            {/* TimeZoneSelect is a custom component - wrap it to work with the form */}
            <div className="max-w-md">
              <TimeZoneSelect
                name="timeZone"
                defaultValue={form.watch('timeZone')}
                onChange={value => form.setValue('timeZone', value)}
              />
            </div>
          </SettingsRow>
        </div>
      )}
    </AutosaveForm>
  );
}
