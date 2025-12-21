interface StatusBadgeProps {
    status: string;
    count?: number;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export default function StatusBadge({ status, count, variant = 'default' }: StatusBadgeProps) {
    const variantStyles = {
        default: 'analytics-badge-default',
        success: 'analytics-badge-success',
        warning: 'analytics-badge-warning',
        danger: 'analytics-badge-danger',
        info: 'analytics-badge-info'
    };

    // Auto-detect variant based on status
    let autoVariant = variant;
    if (variant === 'default') {
        if (status === 'RESOLVED') autoVariant = 'success';
        else if (status === 'OPEN') autoVariant = 'danger';
        else if (status === 'ACKNOWLEDGED') autoVariant = 'info';
        else if (status === 'SNOOZED' || status === 'SUPPRESSED') autoVariant = 'warning';
    }

    return (
        <span className={`analytics-status-badge ${variantStyles[autoVariant]}`}>
            {status}
            {count !== undefined && <span className="analytics-badge-count">{count}</span>}
        </span>
    );
}

