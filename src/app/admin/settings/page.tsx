import { verifySession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AdminSettingsClient from './settings-client';

export default async function AdminSettingsPage() {
  const session = await verifySession();
  if (!session || (session.role !== 'admin' && session.role !== 'ADMIN')) {
    redirect('/login?next=/admin/settings');
  }

  return <AdminSettingsClient />;
}
