'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Mic, 
  Users, 
  ArrowRight, 
  Plus, 
  Award,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Interview, Presentation } from '@/lib/supabase/types';

interface DashboardStats {
  totalSessions: number;
  avgScore: number | null;
  recentActivity: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    avgScore: null,
    recentActivity: 0,
  });
  const [recentSessions, setRecentSessions] = useState<(Interview | Presentation)[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch interviews
      const { data: interviewsData } = await supabase
        .from('interviews')
        .select(`*, questions:questions(score)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch presentations
      const { data: presentationsData } = await supabase
        .from('presentations')
        .select(`*, panel_questions:panel_questions(score)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const interviews = (interviewsData || []) as Interview[];
      const presentations = (presentationsData || []) as Presentation[];

      // Calculate scores
      let totalScore = 0;
      let scoreCount = 0;
      
      interviews.forEach((i: any) => {
        i.questions?.forEach((q: any) => {
          if (q.score) { totalScore += q.score; scoreCount++; }
        });
      });
      
      presentations.forEach((p: any) => {
        p.panel_questions?.forEach((q: any) => {
          if (q.score) { totalScore += q.score; scoreCount++; }
        });
      });

      // Combine and sort recent sessions
      const allSessions = [
        ...interviews.map(i => ({ ...i, type: 'interview' as const })),
        ...presentations.map(p => ({ ...p, type: 'presentation' as const })),
      ].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

      setStats({
        totalSessions: interviews.length + presentations.length,
        avgScore: scoreCount > 0 ? Math.round((totalScore / scoreCount) * 10) / 10 : null,
        recentActivity: allSessions.filter(s => {
          const daysSince = (Date.now() - new Date(s.created_at!).getTime()) / (1000 * 60 * 60 * 24);
          return daysSince <= 7;
        }).length,
      });

      setRecentSessions(allSessions.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-3 border-wood border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track your progress and keep practicing</p>
        </div>
        <Link href="/saphira-interview">
          <Button className="bg-wood hover:bg-wood-dark text-white rounded-full px-5 text-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            New Session
          </Button>
        </Link>
      </div>

      {/* Quick Start Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/saphira-interview" className="group">
          <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md hover:border-wood/20 transition-all">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 bg-wood rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-wood transition-colors" />
            </div>
            <h3 className="font-semibold text-charcoal mt-3">AI Interview</h3>
            <p className="text-gray-500 text-xs mt-1">Practice with AI interviewers in any scenario</p>
          </div>
        </Link>
        <Link href="/presentation" className="group">
          <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md hover:border-wood/20 transition-all">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 bg-charcoal rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-wood transition-colors" />
            </div>
            <h3 className="font-semibold text-charcoal mt-3">Board Presentation</h3>
            <p className="text-gray-500 text-xs mt-1">Present to a multi-persona executive panel</p>
          </div>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-400 text-xs mb-1">Total Sessions</p>
          <p className="text-2xl font-bold text-charcoal">{stats.totalSessions}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-400 text-xs mb-1">Average Score</p>
          <p className={`text-2xl font-bold ${stats.avgScore ? getScoreColor(stats.avgScore) : 'text-gray-400'}`}>
            {stats.avgScore || '-'}
            <span className="text-sm text-gray-300 font-normal">/10</span>
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-400 text-xs mb-1">This Week</p>
          <p className="text-2xl font-bold text-charcoal">{stats.recentActivity}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-charcoal text-sm">Recent Activity</h2>
          <Link href="/feedback" className="text-wood text-xs hover:underline">
            View all
          </Link>
        </div>
        
        {recentSessions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentSessions.map((session: any) => (
              <div key={session.id} className="px-5 py-3 flex items-center justify-between hover:bg-linen/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    session.type === 'interview' ? 'bg-wood/10' : 'bg-charcoal/10'
                  }`}>
                    {session.type === 'interview' ? (
                      <Mic className="w-4 h-4 text-wood" />
                    ) : (
                      <Users className="w-4 h-4 text-charcoal" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-charcoal text-sm">
                      {session.job_role || session.topic || 'Untitled Session'}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(session.created_at!).toLocaleDateString(undefined, { 
                        month: 'short', day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                {session.score && (
                  <span className={`text-sm font-semibold ${getScoreColor(session.score)}`}>
                    {session.score}/10
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-wood/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-wood" />
            </div>
            <p className="text-gray-500 text-sm mb-4">No sessions yet</p>
            <Link href="/saphira-interview">
              <Button className="bg-wood hover:bg-wood-dark text-white rounded-full text-sm">
                Start Your First Session
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-wood/5 rounded-xl p-4 border border-wood/10">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-wood" />
            <h3 className="font-semibold text-charcoal text-sm">Practice Tip</h3>
          </div>
          <p className="text-gray-500 text-xs leading-relaxed">
            Aim for 2-3 minute answers. Concise but complete responses show confidence and clarity.
          </p>
        </div>
        <div className="bg-wood/5 rounded-xl p-4 border border-wood/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-wood" />
            <h3 className="font-semibold text-charcoal text-sm">Improvement</h3>
          </div>
          <p className="text-gray-500 text-xs leading-relaxed">
            Review your feedback after each session. Small improvements compound over time.
          </p>
        </div>
      </div>
    </div>
  );
}
