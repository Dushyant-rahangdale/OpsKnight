'use client';

type Props = {
    tone: 'ok' | 'danger';
    label: string;
    detail: string;
};

export default function OperationalStatus({ tone, label, detail }: Props) {
    const isDanger = tone === 'danger';
    
    return (
        <div className={`ops-status-pill ${tone}`} title={detail}>
            <span className={`ops-status-dot ${tone}`} />
            <span className="ops-status-pill-text">{label}</span>
        </div>
    );
}
