import { Inter } from "next/font/google";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Mic, 
  Users, 
  MessageSquare, 
  LogOut,
  Sparkles,
  Coins,
  UserCircle,
  Settings,
  BarChart3
} from "lucide-react";
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
    <div className={`min-h-screen bg-[#0a0a0f] ${inter.variable} font-sans`}>
      {/* Aurora Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-40" style={{
          background: `radial-gradient(ellipse at 20% 20%, rgba(139, 90, 43, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(106, 27, 154, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(21, 101, 192, 0.08) 0%, transparent 60%)`
        }} />
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-20" style={{
          background: 'linear-gradient(135deg, #8B5A2B 0%, #D2B48C 100%)', top: '10%', left: '10%', animation: 'float 20s ease-in-out infinite',
        }} />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-15" style={{
          background: 'linear-gradient(135deg, #6A1B9A 0%, #BA68C8 100%)', bottom: '10%', right: '10%', animation: 'float 25s ease-in-out infinite reverse',
        }} />
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 hidden lg:flex flex-col z-20">
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#8B5A2B] to-[#D2B48C] rounded-xl flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Saphire</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link 
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all text-sm"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link 
            href="/saphira-interview"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all text-sm"
          >
            <Mic className="w-5 h-5" />
            <span className="font-medium">Interview</span>
          </Link>
          <Link 
            href="/presentation"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all text-sm"
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Presentation</span>
          </Link>
          <Link 
            href="/feedback"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all text-sm"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Feedback</span>
          </Link>
          <Link 
            href="/credits"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all text-sm"
          >
            <Coins className="w-5 h-5" />
            <span className="font-medium">Credits</span>
          </Link>
          <Link 
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all text-sm"
          >
            <UserCircle className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </Link>
          <Link 
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all text-sm"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#8B5A2B] to-[#D2B48C] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{user?.email?.[0].toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-xs text-white/50">Free Plan</p>
            </div>
          </div>
          <form action={signOut}>
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#8B5A2B] to-[#D2B48C] rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Saphire</span>
          </Link>
          <form action={signOut}>
            <button type="submit" className="p-2 text-white/60 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
        <nav className="flex px-4 pb-3 gap-2 overflow-x-auto">
          <Link href="/dashboard" className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-white whitespace-nowrap">
            Dashboard
          </Link>
          <Link href="/saphira-interview" className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-white whitespace-nowrap">
            Interview
          </Link>
          <Link href="/presentation" className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-white whitespace-nowrap">
            Presentation
          </Link>
          <Link href="/feedback" className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-white whitespace-nowrap">
            Feedback
          </Link>
          <Link href="/credits" className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-white whitespace-nowrap">
            Credits
          </Link>
          <Link href="/profile" className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-white whitespace-nowrap">
            Profile
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen relative z-10">
        {children}
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(50px, -30px); }
          50% { transform: translate(-30px, 50px); }
          75% { transform: translate(30px, 30px); }
        }
      `}</style>
    </div>
  );
}
