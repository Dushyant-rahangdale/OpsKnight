'use client';

type Props = {
    tone: 'ok' | 'danger';
    label: string;
    detail: string;
};

export default function OperationalStatus({ tone, label, detail }: Props) {
    const isDanger = tone === 'danger';
    
    return (
        <div className="ops-status-new">
            <div className={`ops-status-indicator ${tone}`}>
                <div className={`ops-status-pulse ${tone}`} />
                <div className="ops-status-dot" />
            </div>
            <div className="ops-status-content">
                <div className="ops-status-header">
                    <span className="ops-status-label">System Status</span>
                    <span className={`ops-status-badge ${tone}`}>
                        {isDanger ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M6 1L1 3V6C1 9.31371 3.68629 12 7 12C10.3137 12 13 9.31371 13 6V3L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M7 6V8M7 4H7.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        ) : (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M6 1L1 3V6C1 9.31371 3.68629 12 7 12C10.3137 12 13 9.31371 13 6V3L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M4 6L5.5 7.5L9 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
                    </span>
                </div>
                <div className="ops-status-main">
                    <span className={`ops-status-value ${tone}`}>{label}</span>
                    <span className="ops-status-detail">{detail}</span>
                </div>
            </div>
        </div>
    );
}
