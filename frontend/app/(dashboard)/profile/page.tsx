'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Calendar, 
  Award, 
  Clock, 
  Edit2, 
  Loader2,
  ArrowLeft,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        last_sign_in: user.last_sign_in_at,
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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-wood border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load profile. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 bg-wood rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wood focus:outline-none"
                  placeholder="Your name"
                />
                <Button 
                  size="sm" 
                  onClick={handleSaveName}
                  disabled={saving}
                  className="bg-wood hover:bg-wood-dark"
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
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-charcoal">{profile.full_name}</h1>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-gray-400 hover:text-wood rounded-lg hover:bg-wood/10 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500 mt-1">
              <Mail className="w-4 h-4" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
              <Calendar className="w-4 h-4" />
              <span>Member since {stats?.memberSince}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-wood/10 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-wood" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Sessions</p>
                <p className="text-2xl font-bold text-charcoal">{stats?.totalSessions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Interviews</p>
                <p className="text-2xl font-bold text-charcoal">{stats?.totalInterviews || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Presentations</p>
                <p className="text-2xl font-bold text-charcoal">{stats?.totalPresentations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Credits</p>
                <p className="text-2xl font-bold text-charcoal">
                  {creditBalance !== null ? creditBalance : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/settings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Edit2 className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal">Account Settings</h3>
                <p className="text-sm text-gray-500">Change password and preferences</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/credits">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal">Buy Credits</h3>
                <p className="text-sm text-gray-500">Purchase more practice sessions</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
