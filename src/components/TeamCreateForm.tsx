'use client';

import { useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { getUserFriendlyError } from '@/lib/user-friendly-errors';

type FormState = {
  error?: string | null;
  success?: boolean;
};

type Props = {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="glass-button primary"
      disabled={pending}
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #020617 100%)',
        color: '#ffffff',
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        border: 'none',
        fontWeight: 600,
        cursor: pending ? 'not-allowed' : 'pointer',
        opacity: pending ? 0.6 : 1,
      }}
    >
      {pending ? 'Creating...' : 'Create Team'}
    </button>
  );
}

export default function TeamCreateForm({ action }: Props) {
  const [state, formAction] = useActionState(action, { error: null, success: false });
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
    >
      <div>
        <label
          style={{
            display: 'block',
            marginBottom: '0.4rem',
            fontSize: '0.9rem',
            fontWeight: '500',
          }}
        >
          Team Name *
        </label>
        <input
          name="name"
          required
          placeholder="e.g. Platform Operations"
          maxLength={200}
          style={{
            width: '100%',
            padding: '0.6rem',
            border: '1px solid var(--border)',
            borderRadius: '4px',
          }}
        />
      </div>
      <div>
        <label
          style={{
            display: 'block',
            marginBottom: '0.4rem',
            fontSize: '0.9rem',
            fontWeight: '500',
          }}
        >
          Description
        </label>
        <input
          name="description"
          placeholder="What does this team own?"
          maxLength={1000}
          style={{
            width: '100%',
            padding: '0.6rem',
            border: '1px solid var(--border)',
            borderRadius: '4px',
          }}
        />
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <SubmitButton />
        {state?.error ? (
          <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
            {getUserFriendlyError(state.error)}
          </span>
        ) : null}
      </div>
    </form>
  );
}
