interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
    return (
        <div className="analytics-empty-state">
            {icon && <div className="analytics-empty-icon">{icon}</div>}
            <h3 className="analytics-empty-title">{title}</h3>
            {description && <p className="analytics-empty-description">{description}</p>}
        </div>
    );
}

