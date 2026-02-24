import { Inter } from "next/font/google";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Mic, 
  Users, 
  MessageSquare, 
  LogOut,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

async function signOut() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className={`min-h-screen bg-linen ${inter.variable} font-sans`}>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 hidden lg:block">
        <div className="p-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-charcoal tracking-tight">SAPHIRA</span>
          </Link>

          <nav className="space-y-1">
            <Link 
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-charcoal hover:bg-linen transition-colors text-sm"
            >
              <LayoutDashboard className="w-4 h-4 text-wood" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link 
              href="/saphira-interview"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-charcoal hover:bg-linen transition-colors text-sm"
            >
              <Mic className="w-4 h-4 text-wood" />
              <span className="font-medium">Interview</span>
            </Link>
            <Link 
              href="/presentation"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-charcoal hover:bg-linen transition-colors text-sm"
            >
              <Users className="w-4 h-4 text-wood" />
              <span className="font-medium">Presentation</span>
            </Link>
            <Link 
              href="/feedback"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-charcoal hover:bg-linen transition-colors text-sm"
            >
              <MessageSquare className="w-4 h-4 text-wood" />
              <span className="font-medium">Feedback</span>
            </Link>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-wood/10 rounded-full flex items-center justify-center">
              <span className="text-wood text-sm font-bold">{user?.email?.[0].toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-400">Free Plan</p>
            </div>
          </div>
          <form action={signOut}>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full rounded-lg border-gray-200 text-gray-500 hover:text-charcoal text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="w-7 h-7 object-contain" />
            <span className="font-bold text-charcoal">SAPHIRA</span>
          </Link>
          <form action={signOut}>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <LogOut className="w-4 h-4" />
            </Button>
          </form>
        </div>
        <nav className="flex px-4 pb-3 gap-2 overflow-x-auto">
          <Link href="/dashboard" className="px-4 py-2 bg-linen rounded-full text-sm font-medium text-charcoal whitespace-nowrap">
            Dashboard
          </Link>
          <Link href="/saphira-interview" className="px-4 py-2 bg-linen rounded-full text-sm font-medium text-charcoal whitespace-nowrap">
            Interview
          </Link>
          <Link href="/presentation" className="px-4 py-2 bg-linen rounded-full text-sm font-medium text-charcoal whitespace-nowrap">
            Presentation
          </Link>
          <Link href="/feedback" className="px-4 py-2 bg-linen rounded-full text-sm font-medium text-charcoal whitespace-nowrap">
            Feedback
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
