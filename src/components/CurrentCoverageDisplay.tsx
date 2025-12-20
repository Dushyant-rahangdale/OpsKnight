'use client';

import { useEffect, useState } from 'react';

type CoverageBlock = {
    id: string;
    userName: string;
    layerName: string;
    start: Date;
    end: Date;
};

type CurrentCoverageDisplayProps = {
    initialBlocks: CoverageBlock[];
    scheduleTimeZone: string;
};

export default function CurrentCoverageDisplay({ 
    initialBlocks, 
    scheduleTimeZone
}: CurrentCoverageDisplayProps) {
    // Format date/time function inside the client component
    const formatDateTime = (date: Date) =>
        date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZone: scheduleTimeZone
        });
    const [activeBlocks, setActiveBlocks] = useState(initialBlocks);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Recalculate when initialBlocks prop changes (e.g., after layer update)
    useEffect(() => {
        const calculateActive = () => {
            const now = new Date();
            setCurrentTime(now);
            
            // Recalculate active blocks based on current time
            const nowTime = now.getTime();
            const active = initialBlocks.filter((block) => {
                // Handle both Date objects and ISO strings
                const blockStart = block.start instanceof Date ? block.start : new Date(block.start);
                const blockEnd = block.end instanceof Date ? block.end : new Date(block.end);
                const blockStartTime = blockStart.getTime();
                const blockEndTime = blockEnd.getTime();
                return blockStartTime <= nowTime && blockEndTime > nowTime;
            });
            setActiveBlocks(active);
        };
        
        // Calculate immediately when initialBlocks changes
        calculateActive();
    }, [initialBlocks]);

    // Update current time every 30 seconds and recalculate active blocks
    useEffect(() => {
        const calculateActive = () => {
            const now = new Date();
            setCurrentTime(now);
            
            // Recalculate active blocks based on current time
            const nowTime = now.getTime();
            const active = initialBlocks.filter((block) => {
                // Handle both Date objects and ISO strings
                const blockStart = block.start instanceof Date ? block.start : new Date(block.start);
                const blockEnd = block.end instanceof Date ? block.end : new Date(block.end);
                const blockStartTime = blockStart.getTime();
                const blockEndTime = blockEnd.getTime();
                return blockStartTime <= nowTime && blockEndTime > nowTime;
            });
            setActiveBlocks(active);
        };
        
        // Update every 30 seconds
        const interval = setInterval(calculateActive, 30000);

        return () => clearInterval(interval);
    }, [initialBlocks]);

    const nextChange = activeBlocks.length
        ? activeBlocks.reduce((earliest, block) => {
            const blockEndTime = new Date(block.end).getTime();
            const earliestTime = new Date(earliest).getTime();
            return blockEndTime < earliestTime ? block.end : earliest;
        }, activeBlocks[0].end)
        : null;

    return (
        <div className="glass-panel" style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            marginBottom: '1.5rem'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #e2e8f0'
            }}>
                <div>
                    <h3 style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '600', 
                        color: 'var(--text-primary)', 
                        margin: 0,
                        marginBottom: '0.25rem'
                    }}>
                        Current Coverage
                    </h3>
                    <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-muted)',
                        margin: 0
                    }}>
                        Updated: {currentTime.toLocaleTimeString()}
                    </p>
                </div>
                {activeBlocks.length > 0 && (
                    <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)',
                        color: '#065f46',
                        border: '1px solid #a7f3d0'
                    }}>
                        {activeBlocks.length} {activeBlocks.length === 1 ? 'responder' : 'responders'}
                    </span>
                )}
            </div>
            {activeBlocks.length === 0 ? (
                <div style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '8px'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
                    <p style={{ 
                        fontSize: '0.9rem', 
                        color: 'var(--text-muted)',
                        margin: 0,
                        marginBottom: '0.5rem'
                    }}>
                        No one is currently assigned.
                    </p>
                    <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                        margin: 0
                    }}>
                        Check layer start times and ensure layers have responders assigned.
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                        {activeBlocks.map((block) => (
                            <div 
                                key={block.id} 
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem',
                                    background: '#f8fafc',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    flexShrink: 0
                                }}>
                                    {block.userName.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ 
                                        fontWeight: '600', 
                                        fontSize: '0.9rem', 
                                        color: 'var(--text-primary)',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {block.userName}
                                    </div>
                                    <div style={{ 
                                        fontSize: '0.8rem', 
                                        color: 'var(--text-muted)',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '0.25rem',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{
                                            padding: '0.15rem 0.4rem',
                                            borderRadius: '4px',
                                            background: '#e0f2fe',
                                            color: '#0c4a6e',
                                            fontSize: '0.7rem',
                                            fontWeight: '500'
                                        }}>
                                            {block.layerName}
                                        </span>
                                        <span>·</span>
                                        <span>Until {formatDateTime(new Date(block.end))}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {nextChange && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            border: '1px solid #fde68a',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: '#78350f',
                            fontWeight: '500',
                            textAlign: 'center'
                        }}>
                            ⏰ Next change: {formatDateTime(new Date(nextChange))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

