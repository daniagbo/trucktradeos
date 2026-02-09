import { verifySession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AdminRfqsClient from './rfqs-client';

export default async function AdminRfqsPage() {
    const session = await verifySession();

    if (!session || (session.role !== 'admin' && session.role !== 'ADMIN')) {
        redirect('/login?next=/admin/rfqs');
    }

    return <AdminRfqsClient />;
}
