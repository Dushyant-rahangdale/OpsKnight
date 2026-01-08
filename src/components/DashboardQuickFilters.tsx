'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';

const quickFilters = [
  {
    label: 'Open',
    icon: '📋',
    buildUrl: (params: URLSearchParams) => {
      if (
        params.get('status') === 'OPEN' &&
        !params.get('assignee') &&
        !params.get('service') &&
        !params.get('urgency')
      ) {
        return '/';
      }
      const newParams = new URLSearchParams();
      newParams.set('status', 'OPEN');
      return `/?${newParams.toString()}`;
    },
    isActive: (params: URLSearchParams) => {
      const status = params.get('status');
      const assignee = params.get('assignee');
      const service = params.get('service');
      const urgency = params.get('urgency');
      return status === 'OPEN' && !assignee && !service && !urgency;
    },
  },
  {
    label: 'Critical',
    icon: '🔴',
    buildUrl: (params: URLSearchParams) => {
      if (params.get('status') === 'OPEN' && params.get('urgency') === 'HIGH') {
        return '/';
      }
      const newParams = new URLSearchParams();
      newParams.set('status', 'OPEN');
      newParams.set('urgency', 'HIGH');
      return `/?${newParams.toString()}`;
    },
    isActive: (params: URLSearchParams) => {
      return params.get('status') === 'OPEN' && params.get('urgency') === 'HIGH';
    },
  },
  {
    label: 'Unassigned',
    icon: '⚠️',
    buildUrl: (params: URLSearchParams) => {
      if (params.get('status') === 'OPEN' && params.get('assignee') === '') {
        return '/';
      }
      const newParams = new URLSearchParams();
      newParams.set('status', 'OPEN');
      newParams.set('assignee', '');
      return `/?${newParams.toString()}`;
    },
    isActive: (params: URLSearchParams) => {
      return params.get('status') === 'OPEN' && params.get('assignee') === '';
    },
  },
  {
    label: 'Recent',
    icon: '🕐',
    buildUrl: (params: URLSearchParams) => {
      const newParams = new URLSearchParams(params.toString());
      newParams.set('sortBy', 'createdAt');
      newParams.set('sortOrder', 'desc');
      newParams.delete('page');
      return `/?${newParams.toString()}`;
    },
    isActive: (params: URLSearchParams) => {
      const sortBy = params.get('sortBy');
      const sortOrder = params.get('sortOrder');
      return (sortBy === 'createdAt' || !sortBy) && (sortOrder === 'desc' || !sortOrder);
    },
  },
];

export default function DashboardQuickFilters() {
  const searchParams = useSearchParams();
  const _pathname = usePathname();

  return (
    <div className="flex gap-2 flex-wrap mb-3.5">
      <span className="text-xs text-muted-foreground font-medium self-center uppercase tracking-wide">
        Quick Filters:
      </span>
      {quickFilters.map(filter => {
        const isActive = filter.isActive(searchParams);
        const href = filter.buildUrl(searchParams);

        return (
          <Link
            key={filter.label}
            href={href}
            scroll={false}
            className={`px-3 py-1.5 rounded-full text-xs no-underline font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
              isActive
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-neutral-50 text-secondary-foreground border-border hover:-translate-y-px hover:bg-neutral-100'
            }`}
          >
            <span className="text-xs">{filter.icon}</span>
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}
