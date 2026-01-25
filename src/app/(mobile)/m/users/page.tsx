import React, { JSX } from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { MobileAvatar, MobileEmptyState } from '@/components/mobile/MobileUtils';
import { MobileSearchWithParams } from '@/components/mobile/MobileSearchParams';
import MobileCard from '@/components/mobile/MobileCard';

export const dynamic = 'force-dynamic';

export default async function MobileUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<JSX.Element> {
  const params = await searchParams;
  const query = params.q || '';

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Users</h1>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          {users.length} member{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <MobileSearchWithParams placeholder="Search users by name or email..." />

      {/* User List */}
      <div className="flex flex-col gap-3">
        {users.length === 0 ? (
          <MobileEmptyState
            icon="!"
            title="No users found"
            description="Invite team members to get started"
          />
        ) : (
          users.map(user => (
            <Link key={user.id} href={`/m/users/${user.id}`} className="no-underline">
              <MobileCard className="flex items-center gap-3">
                <MobileAvatar name={user.name || user.email} />

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {user.name || 'Unknown'}
                  </div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {user.email}
                  </div>
                </div>

                <div
                  className={`rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    user.role === 'ADMIN'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {user.role.toLowerCase()}
                </div>

                <span className="text-slate-400 dark:text-slate-500">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </MobileCard>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
