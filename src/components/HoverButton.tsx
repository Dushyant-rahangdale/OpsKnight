'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';

type HoverButtonProps = {
    baseStyle: CSSProperties;
    hoverStyle?: CSSProperties;
    className?: string;
    children: ReactNode;
    type?: 'button' | 'submit' | 'reset';
};

export default function HoverButton({
    baseStyle,
    hoverStyle,
    className,
    children,
    type = 'button'
}: HoverButtonProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            type={type}
            className={className}
            style={isHovered && hoverStyle ? { ...baseStyle, ...hoverStyle } : baseStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}
        </button>
    );
}
