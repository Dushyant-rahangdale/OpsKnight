interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export default function ProgressBar({
    value,
    max = 100,
    label,
    showValue = true,
    variant = 'default',
    size = 'md'
}: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    const variantStyles = {
        default: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500'
    };

    const sizeStyles = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4'
    };

    return (
        <div className="analytics-progress-container">
            {label && (
                <div className="analytics-progress-label">
                    <span>{label}</span>
                    {showValue && <span className="analytics-progress-value">{value.toFixed(1)}%</span>}
                </div>
            )}
            <div className={`analytics-progress-bar ${sizeStyles[size]}`}>
                <div
                    className={`analytics-progress-fill ${variantStyles[variant]}`}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                />
            </div>
        </div>
    );
}

