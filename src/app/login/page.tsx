import LoginClient from './LoginClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type SearchParams = {
    callbackUrl?: string;
    error?: string;
    password?: string;
};

export default async function LoginPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
    // Server-side check: If user is already authenticated, redirect them away
    const session = await getServerSession(authOptions);
    if (session) {
        const awaitedSearchParams = await searchParams;
        const callbackUrl = typeof awaitedSearchParams?.callbackUrl === 'string' 
            ? awaitedSearchParams.callbackUrl 
            : '/';
        // Only redirect to callbackUrl if it's a valid internal path
        const redirectUrl = callbackUrl.startsWith('/') && !callbackUrl.startsWith('/login')
            ? callbackUrl
            : '/'; // Default to dashboard
        redirect(redirectUrl);
    }

    const awaitedSearchParams = await searchParams;
    const callbackUrl = typeof awaitedSearchParams?.callbackUrl === 'string' ? awaitedSearchParams.callbackUrl : '/';
    const errorCode = typeof awaitedSearchParams?.error === 'string' ? awaitedSearchParams.error : null;
    const passwordSet = awaitedSearchParams?.password === '1';

    return (
        <LoginClient callbackUrl={callbackUrl} errorCode={errorCode} passwordSet={passwordSet} />
    );
}
