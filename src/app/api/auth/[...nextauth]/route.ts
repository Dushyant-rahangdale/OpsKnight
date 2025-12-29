import NextAuth from 'next-auth';
import { getAuthOptions } from '@/lib/auth';

const handler = async (
    req: Request,
    context: { params: Promise<{ nextauth: string[] }> }
) => {
    const options = await getAuthOptions();
    const nextAuthHandler = NextAuth(options);
    // Await params as it's now a Promise in Next.js 15+
    const params = await context.params;
    return nextAuthHandler(req, { params });
};

export { handler as GET, handler as POST };
