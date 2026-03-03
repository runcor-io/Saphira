// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default function DashboardRootPage() {
  redirect('/dashboard');
}
