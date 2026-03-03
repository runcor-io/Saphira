// This page simply redirects to /dashboard
// Using generateStaticParams to prevent build-time issues

import { redirect } from 'next/navigation';

export default function DashboardRootPage() {
  redirect('/dashboard');
}

// Prevent static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;
