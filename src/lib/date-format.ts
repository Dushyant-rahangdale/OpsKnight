/**
 * Format date consistently for SSR/Client to avoid hydration mismatches
 */
export function formatDate(date: Date | string, format: 'date' | 'datetime' | 'time' = 'datetime'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (!d || isNaN(d.getTime())) {
        return 'Invalid Date';
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    switch (format) {
        case 'date':
            return `${year}-${month}-${day}`;
        case 'time':
            return `${hours}:${minutes}:${seconds}`;
        case 'datetime':
        default:
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}

/**
 * Format date in a user-friendly way (for display only, not for SSR)
 */
export function formatDateFriendly(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (!d || isNaN(d.getTime())) {
        return 'Invalid Date';
    }

    // Use UTC to ensure consistency
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

