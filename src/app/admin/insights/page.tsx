import { verifySession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AdminInsightsClient from './insights-client';

export default async function AdminInsightsPage() {
  const session = await verifySession();

  if (!session || (session.role !== 'admin' && session.role !== 'ADMIN')) {
    redirect('/login?next=/admin/insights');
  }

  return <AdminInsightsClient />;
}

