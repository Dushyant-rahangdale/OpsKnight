'use client';

import { useEffect } from 'react';

type ToastProps = {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
};

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = type === 'success' ? '#e6f4ea' : type === 'error' ? '#fee2e2' : '#e0f2fe';
    const textColor = type === 'success' ? '#0f5132' : type === 'error' ? '#b91c1c' : '#0c4a6e';
    const borderColor = type === 'success' ? '#86efac' : type === 'error' ? '#fecaca' : '#bae6fd';

    return (
        <div
            style={{
                position: 'fixed',
                top: '1rem',
                right: '1rem',
                padding: '0.75rem 1rem',
                background: bgColor,
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '250px',
                animation: 'slideIn 0.3s ease-out'
            }}
        >
            <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{message}</span>
            <button
                onClick={onClose}
                style={{
                    marginLeft: 'auto',
                    background: 'transparent',
                    border: 'none',
                    color: textColor,
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    lineHeight: 1,
                    padding: '0',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                aria-label="Close"
            >
                ×
            </button>
        </div>
    );
}

