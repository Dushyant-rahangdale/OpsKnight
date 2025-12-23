'use client';

import { useState, useEffect } from 'react';

export default function TopbarClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    const dateStr = time.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    }).toUpperCase();

    return (
        <div className="topbar-clock" title={`${dateStr} - ${hours}:${minutes}:${seconds}`}>
            <div className="topbar-clock-time">
                <span className="topbar-clock-hours">{hours}</span>
                <span className="topbar-clock-separator">:</span>
                <span className="topbar-clock-minutes">{minutes}</span>
                <span className="topbar-clock-seconds">{seconds}</span>
            </div>
            <div className="topbar-clock-date">{dateStr}</div>
        </div>
    );
}

