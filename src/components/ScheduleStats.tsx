type ScheduleStatsProps = {
    scheduleCount: number;
    layerCount: number;
    hasActiveCoverage: boolean;
};

export default function ScheduleStats({ scheduleCount, layerCount, hasActiveCoverage }: ScheduleStatsProps) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '2rem'
        }}>
            <div className="glass-panel" style={{
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Schedules
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {scheduleCount}
                </div>
            </div>
            <div className="glass-panel" style={{
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Layers
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {layerCount}
                </div>
            </div>
            <div className="glass-panel" style={{
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Coverage Status
                </div>
                <div style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: '700',
                    color: hasActiveCoverage ? '#065f46' : '#991b1b'
                }}>
                    {hasActiveCoverage ? 'Healthy' : 'Needs setup'}
                </div>
            </div>
        </div>
    );
}




