'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type Props = {
    initialStatus?: string;
    initialService?: string;
    initialAssignee?: string;
    services: { id: string; name: string }[];
    users: { id: string; name: string }[];
};

export default function DashboardFilters({ initialStatus, initialService, initialAssignee, services, users }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'ALL') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        // Reset to page 1 when filters change
        params.delete('page');
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <form method="get" className="filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</label>
            <select
                    name="status"
                value={initialStatus || 'ALL'}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', background: 'white' }}
            >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved</option>
            </select>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Service</label>
            <select
                    name="service"
                value={initialService || ''}
                onChange={(e) => handleFilterChange('service', e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', background: 'white' }}
            >
                <option value="">All Services</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Assignee</label>
            <select
                    name="assignee"
                value={initialAssignee || ''}
                onChange={(e) => handleFilterChange('assignee', e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', background: 'white' }}
            >
                <option value="">All Assignees</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
        </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a href="/" className="glass-button" style={{ textDecoration: 'none', whiteSpace: 'nowrap', padding: '0.6rem 1rem' }}>Clear</a>
            </div>
        </form>
    );
}
