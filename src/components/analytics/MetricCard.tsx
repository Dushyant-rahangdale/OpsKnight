
interface MetricCardProps {
    label: string;
    value: string;
    detail: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export default function MetricCard({
    label,
    value,
    detail,
    trend,
    trendValue,
    icon,
    variant = 'default'
}: MetricCardProps) {
    const variantStyles = {
        default: 'border-gray-200 bg-white',
        primary: 'border-red-200 bg-gradient-to-br from-red-50 to-white',
        success: 'border-green-200 bg-gradient-to-br from-green-50 to-white',
        warning: 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-white',
        danger: 'border-red-300 bg-gradient-to-br from-red-100 to-white'
    };

    const trendColors = {
        up: 'text-green-600',
        down: 'text-red-600',
        neutral: 'text-gray-500'
    };

    return (
        <article className={`analytics-card-enhanced ${variantStyles[variant]}`}>
            <div className="analytics-card-header">
                {icon && <div className="analytics-card-icon">{icon}</div>}
                <span className="analytics-label">{label}</span>
            </div>
            <div className="analytics-card-body">
                <span className="analytics-value">{value}</span>
                {trend && trendValue && (
                    <div className={`analytics-trend ${trendColors[trend]}`}>
                        <span className="analytics-trend-icon">
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                        </span>
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
            <span className="analytics-detail">{detail}</span>
        </article>
    );
}

