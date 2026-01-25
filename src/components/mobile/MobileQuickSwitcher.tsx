'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import MobileSearch from '@/components/mobile/MobileSearch';
import { Skeleton } from '@/components/mobile/SkeletonLoader';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

type ResultType = 'incident' | 'service' | 'team' | 'user' | 'policy' | 'postmortem';

type SearchResult = {
  type: ResultType;
  id: string;
  title: string;
  subtitle?: string;
  incidentId?: string;
};

type RecentItem = SearchResult & { timestamp: number };

const RECENTS_KEY = 'mobileQuickSwitcherRecents';
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

const typeLabels: Record<ResultType, string> = {
  incident: 'Incident',
  service: 'Service',
  team: 'Team',
  user: 'User',
  policy: 'Policy',
  postmortem: 'Postmortem',
};

const typeTones: Record<ResultType, string> = {
  incident: 'danger',
  service: 'blue',
  team: 'teal',
  user: 'slate',
  policy: 'amber',
  postmortem: 'purple',
};

const typeIcons: Record<ResultType, ReactElement> = {
  incident: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l9 16H3l9-16Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 9v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  ),
  service: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="4"
        y="5"
        width="16"
        height="6"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="4"
        y="13"
        width="16"
        height="6"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ),
  team: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3 20c0-3 3-5 6-5s6 2 6 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  policy: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 12l2 2 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  postmortem: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M14 3v5h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 13h6M9 17h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
};

const quickLinks = [
  { href: '/m/incidents', label: 'Incidents' },
  { href: '/m/services', label: 'Services' },
  { href: '/m/teams', label: 'Teams' },
  { href: '/m/schedules', label: 'Schedules' },
];

const toneClasses: Record<string, string> = {
  danger: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300',
};

function mapToMobileHref(result: SearchResult) {
  switch (result.type) {
    case 'incident':
      return `/m/incidents/${result.id}`;
    case 'service':
      return `/m/services/${result.id}`;
    case 'team':
      return `/m/teams/${result.id}`;
    case 'user':
      return `/m/users/${result.id}`;
    case 'policy':
      return `/m/policies/${result.id}`;
    case 'postmortem':
      return `/m/postmortems/${result.id}`;
    default:
      return '/m';
  }
}

function readRecents(): RecentItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(RECENTS_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as RecentItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecents(items: RecentItem[]) {
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage issues silently
  }
}

export default function MobileQuickSwitcher() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recents, setRecents] = useState<RecentItem[]>([]);

  const hasQuery = query.trim().length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!open) {
      return;
    }
    setRecents(readRecents());
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !hasQuery) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Search request failed');
        }
        const data = await response.json();
        setResults((data?.results || []) as SearchResult[]);
      } catch (error: unknown) {
        if ((error as Error).name !== 'AbortError') {
          logger.error('mobile.quickSwitcher.searchFailed', {
            component: 'MobileQuickSwitcher',
            error,
          });
        }
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [open, query, hasQuery]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const recentItems = useMemo(() => recents.slice(0, 5), [recents]);

  const handleSelect = (item: SearchResult) => {
    const updated = [
      { ...item, timestamp: Date.now() },
      ...recents.filter(recent => !(recent.type === item.type && recent.id === item.id)),
    ].slice(0, 6);
    setRecents(updated);
    writeRecents(updated);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/60"
        aria-label="Open quick switcher"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path
            d="M21 21l-4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-end bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-900 dark:bg-slate-950"
            onClick={event => event.stopPropagation()}
          >
            <div className="p-4">
              <MobileSearch
                placeholder="Search incidents, services, teams..."
                value={query}
                onChange={setQuery}
                autoFocus
                rightAction={
                  <button
                    type="button"
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </button>
                }
              />
              <div className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {hasQuery ? 'Search results' : 'Start typing to search'}
              </div>
            </div>

            <div className="px-4 pb-5">
              {!hasQuery ? (
                <>
                  <div className="mb-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Recent
                    </div>
                    {recentItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                        No recent items yet.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {recentItems.map(item => (
                          <Link
                            key={`${item.type}-${item.id}`}
                            href={mapToMobileHref(item)}
                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 transition hover:bg-slate-50 dark:border-slate-900 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                            onClick={() => handleSelect(item)}
                          >
                            <span
                              className={cn(
                                'flex h-9 w-9 items-center justify-center rounded-xl',
                                toneClasses[typeTones[item.type]]
                              )}
                            >
                              {typeIcons[item.type]}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="truncate text-sm font-semibold">{item.title}</span>
                              {item.subtitle && (
                                <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                                  {item.subtitle}
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              {typeLabels[item.type]}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Explore
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {quickLinks.map(link => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-900 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {isLoading && (
                    <div className="flex flex-col gap-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={`qs-skeleton-${index}`}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-900 dark:bg-slate-950"
                        >
                          <span
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-xl',
                              toneClasses.slate
                            )}
                          >
                            <Skeleton width="20px" height="20px" borderRadius="6px" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <Skeleton width="70%" height="12px" borderRadius="4px" />
                            <Skeleton width="45%" height="10px" borderRadius="4px" />
                          </span>
                          <Skeleton width="40px" height="10px" borderRadius="4px" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!isLoading && results.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                      No matches found. Try a different keyword.
                    </div>
                  )}

                  {!isLoading && results.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {results.map(item => (
                        <Link
                          key={`${item.type}-${item.id}`}
                          href={mapToMobileHref(item)}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 transition hover:bg-slate-50 dark:border-slate-900 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                          onClick={() => handleSelect(item)}
                        >
                          <span
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-xl',
                              toneClasses[typeTones[item.type]]
                            )}
                          >
                            {typeIcons[item.type]}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate text-sm font-semibold">{item.title}</span>
                            {item.subtitle && (
                              <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {item.subtitle}
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            {typeLabels[item.type]}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
