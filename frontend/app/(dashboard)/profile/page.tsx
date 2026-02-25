'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Calendar, 
  Award, 
  Clock, 
  Edit2, 
  Loader2,
  CreditCard,
  Mic,
  Users,
  Home,
  BarChart3,
  Settings,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getCreditBalance } from '@/lib/paystack';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_sign_in: string | null;
}

interface UserStats {
  totalSessions: number;
  totalInterviews: number;
  totalPresentations: number;
  memberSince: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    fetchProfileData();
  }, []);

  async function fetchProfileData() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user metadata from auth
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      
      setProfile({
        id: user.id,
        email: user.email || '',
        full_name: fullName,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at || null,
      });
      setEditName(fullName);

      // Fetch session stats
      const { count: interviewCount } = await supabase
        .from('interviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: presentationCount } = await supabase
        .from('presentations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        totalSessions: (interviewCount || 0) + (presentationCount || 0),
        totalInterviews: interviewCount || 0,
        totalPresentations: presentationCount || 0,
        memberSince: new Date(user.created_at).toLocaleDateString('en-NG', {
          month: 'long',
          year: 'numeric',
        }),
      });

      // Try to fetch credit balance
      try {
        const balance = await getCreditBalance();
        setCreditBalance(balance.balance);
      } catch (e) {
        // Credits API might not be available yet
        setCreditBalance(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveName() {
    if (!profile || !editName.trim()) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: editName.trim() }
      });

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, full_name: editName.trim() } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8B5A2B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50">Failed to load profile. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex overflow-hidden">
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

      {/* Left Sidebar */}
      <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col relative z-10">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#8B5A2B] to-[#D2B48C] rounded-xl flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Saphire</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { icon: Home, label: 'Dashboard', active: false, href: '/dashboard' },
            { icon: Mic, label: 'Interview', active: false, href: '/saphira-interview' },
            { icon: Users, label: 'Presentation', active: false, href: '/presentation' },
            { icon: BarChart3, label: 'Feedback', active: false, href: '/feedback' },
            { icon: Settings, label: 'Settings', active: false, href: '/settings' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Home className="w-5 h-5 text-white/60" />
            </button>
            <div>
              <h1 className="text-white font-semibold">Profile</h1>
              <p className="text-white/50 text-sm">Manage your account information</p>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#8B5A2B] to-[#D2B48C] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50"
                        placeholder="Your name"
                      />
                      <Button 
                        size="sm" 
                        onClick={handleSaveName}
                        disabled={saving}
                        className="bg-gradient-to-r from-[#8B5A2B] to-[#D2B48C] hover:shadow-lg hover:shadow-[#8B5A2B]/30"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setEditName(profile.full_name || '');
                          setIsEditing(false);
                        }}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 text-white/40 hover:text-[#8B5A2B] rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-white/50 mt-2">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/40 text-sm mt-2">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {stats?.memberSince}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#8B5A2B]/20 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-[#8B5A2B]" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-wider">Total Sessions</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalSessions || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-wider">Interviews</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalInterviews || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-wider">Presentations</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalPresentations || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-wider">Credits</p>
                    <p className="text-2xl font-bold text-white">
                      {creditBalance !== null ? creditBalance : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/settings">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white/60 group-hover:text-[#8B5A2B] transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">Account Settings</h3>
                      <p className="text-sm text-white/50">Change password and preferences</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-[#8B5A2B] transition-colors" />
                  </div>
                </div>
              </Link>

              <Link href="/credits">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-amber-400 group-hover:text-amber-300 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">Buy Credits</h3>
                      <p className="text-sm text-white/50">Purchase more practice sessions</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-amber-400 transition-colors" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
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
