'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type SearchResult = {
    type: 'incident' | 'service' | 'team' | 'user' | 'policy';
    id: string;
    title: string;
    subtitle?: string;
    href: string;
};

export default function SidebarSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 0);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setQuery('');
                setResults([]);
            }
            if (isOpen && results.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                } else if (e.key === 'Enter' && selectedIndex >= 0) {
                    e.preventDefault();
                    router.push(results[selectedIndex].href);
                    setIsOpen(false);
                    setQuery('');
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, router]);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setSelectedIndex(-1);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                if (response.ok) {
                    const data = await response.json();
                    setResults(data.results || []);
                    setSelectedIndex(-1);
                }
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleResultClick = (href: string) => {
        router.push(href);
        setIsOpen(false);
        setQuery('');
    };

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="topbar-search-trigger"
                aria-label="Search"
            >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <span className="topbar-search-placeholder">Search incidents, services, teams...</span>
                <kbd className="topbar-search-shortcut">
                    <span className="topbar-search-shortcut-key">⌘</span>
                    <span className="topbar-search-shortcut-key">K</span>
                </kbd>
            </button>
        );
    }

    return (
        <div className="topbar-search-container">
            <div className="topbar-search-input-wrapper">
                <svg className="topbar-search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search incidents, services, teams..."
                    className="topbar-search-input"
                    autoFocus
                />
                <button
                    type="button"
                    onClick={() => {
                        setIsOpen(false);
                        setQuery('');
                    }}
                    className="topbar-search-close"
                    aria-label="Close search"
                >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {query.length >= 2 && (
                <>
                    <div
                        className="topbar-search-overlay"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="topbar-search-results">
                        {results.length === 0 ? (
                            <div className="topbar-search-empty">
                                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                <p>No results found for &quot;{query}&quot;</p>
                                <span className="topbar-search-empty-hint">Try a different search term</span>
                            </div>
                        ) : (
                            <>
                                <div className="topbar-search-results-header">
                                    <span>Results ({results.length})</span>
                                </div>
                                {results.map((result, index) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        type="button"
                                        onClick={() => handleResultClick(result.href)}
                                        className={`topbar-search-result ${selectedIndex === index ? 'selected' : ''}`}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <div className={`topbar-search-result-icon ${result.type}`}>
                                            {getTypeIcon(result.type)}
                                        </div>
                                        <div className="topbar-search-result-content">
                                            <div className="topbar-search-result-title">{result.title}</div>
                                            {result.subtitle && (
                                                <div className="topbar-search-result-subtitle">{result.subtitle}</div>
                                            )}
                                        </div>
                                        <div className="topbar-search-result-badge">{result.type}</div>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function getTypeIcon(type: SearchResult['type']): React.ReactNode {
    const icons = {
        incident: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3 2.5 20h19L12 3Zm0 6 4.5 9h-9L12 9Zm0 3v4" strokeLinecap="round" />
            </svg>
        ),
        service: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M4 6h16v5H4V6Zm0 7h16v5H4v-5Z" />
            </svg>
        ),
        team: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M7 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm10 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM3 19a4 4 0 0 1 8 0v1H3v-1Zm10 1v-1a4 4 0 0 1 8 0v1h-8Z" />
            </svg>
        ),
        user: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 20a6 6 0 0 1 16 0v1H4v-1Z" />
            </svg>
        ),
        policy: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5Z" />
            </svg>
        )
    };
    return icons[type];
}
