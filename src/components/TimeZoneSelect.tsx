'use client';

import { useEffect, useState } from 'react';
import { getAllTimeZones } from '@/lib/timezone';

type TimeZoneSelectProps = {
    name: string;
    defaultValue?: string;
    id?: string;
    disabled?: boolean;
};

export default function TimeZoneSelect({ name, defaultValue = 'UTC', id, disabled }: TimeZoneSelectProps) {
    const [zones, setZones] = useState<Array<{ value: string; label: string }>>([]);

    useEffect(() => {
        // Load timezones with labels
        const timezones = getAllTimeZones();
        setZones(timezones);
    }, []);

    return (
        <select name={name} defaultValue={defaultValue} id={id} disabled={disabled}>
            {zones.map((zone) => (
                <option key={zone.value} value={zone.value}>
                    {zone.label}
                </option>
            ))}
        </select>
    );
}
