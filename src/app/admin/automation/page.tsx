import { verifySession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AdminAutomationClient from './automation-client';

export default async function AdminAutomationPage() {
  const session = await verifySession();

  if (!session || (session.role !== 'admin' && session.role !== 'ADMIN')) {
    redirect('/login?next=/admin/automation');
  }

  return <AdminAutomationClient />;
}

