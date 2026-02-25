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

      const { data: interviewsData } = await supabase
        .from('interviews')
        .select(`*, questions:questions(score)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: presentationsData } = await supabase
        .from('presentations')
        .select(`*, panel_questions:panel_questions(score)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const interviews = (interviewsData || []) as Interview[];
      const presentations = (presentationsData || []) as Presentation[];

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
    if (!score) return 'text-white/40';
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-amber-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8B5A2B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-white font-semibold">Dashboard</h1>
              <p className="text-white/50 text-sm">Track your progress and keep practicing</p>
            </div>
          </div>
          <Link href="/saphira-interview">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#8B5A2B] to-[#D2B48C] text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-[#8B5A2B]/30 transition-all">
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </Link>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Quick Start Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Link href="/saphira-interview" className="group">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-[#8B5A2B]/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#8B5A2B] to-[#D2B48C] rounded-xl flex items-center justify-center">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-[#8B5A2B] transition-colors" />
                  </div>
                  <h3 className="font-semibold text-white mt-4 text-lg">AI Interview</h3>
                  <p className="text-white/50 text-sm mt-1">Practice with AI interviewers in any scenario</p>
                </div>
              </Link>
              <Link href="/presentation" className="group">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-[#8B5A2B]/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#6A1B9A] to-[#BA68C8] rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-[#8B5A2B] transition-colors" />
                  </div>
                  <h3 className="font-semibold text-white mt-4 text-lg">Board Presentation</h3>
                  <p className="text-white/50 text-sm mt-1">Present to a multi-persona executive panel</p>
                </div>
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <p className="text-white/50 text-xs mb-2 uppercase tracking-wider">Total Sessions</p>
                <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <p className="text-white/50 text-xs mb-2 uppercase tracking-wider">Average Score</p>
                <p className={`text-3xl font-bold ${stats.avgScore ? getScoreColor(stats.avgScore) : 'text-white/40'}`}>
                  {stats.avgScore || '-'}
                  <span className="text-lg text-white/30 font-normal ml-1">/10</span>
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <p className="text-white/50 text-xs mb-2 uppercase tracking-wider">This Week</p>
                <p className="text-3xl font-bold text-white">{stats.recentActivity}</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-semibold text-white">Recent Activity</h2>
                <Link href="/feedback" className="text-[#8B5A2B] text-sm hover:text-[#D2B48C] transition-colors">
                  View all
                </Link>
              </div>
              
              {recentSessions.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {recentSessions.map((session: any) => (
                    <div key={session.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          session.type === 'interview' 
                            ? 'bg-[#8B5A2B]/20' 
                            : 'bg-[#6A1B9A]/20'
                        }`}>
                          {session.type === 'interview' ? (
                            <Mic className="w-5 h-5 text-[#8B5A2B]" />
                          ) : (
                            <Users className="w-5 h-5 text-[#6A1B9A]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {session.job_role || session.topic || 'Untitled Session'}
                          </p>
                          <p className="text-white/40 text-sm">
                            {new Date(session.created_at!).toLocaleDateString(undefined, { 
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      {session.score && (
                        <span className={`text-lg font-semibold ${getScoreColor(session.score)}`}>
                          {session.score}/10
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-[#8B5A2B]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-[#8B5A2B]" />
                  </div>
                  <p className="text-white/50 text-sm mb-4">No sessions yet</p>
                  <Link href="/saphira-interview">
                    <button className="px-6 py-2.5 bg-gradient-to-r from-[#8B5A2B] to-[#D2B48C] text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-[#8B5A2B]/30 transition-all">
                      Start Your First Session
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#8B5A2B]/20 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-[#8B5A2B]" />
                  </div>
                  <h3 className="font-semibold text-white">Practice Tip</h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">
                  Aim for 2-3 minute answers. Concise but complete responses show confidence and clarity.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#8B5A2B]/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#8B5A2B]" />
                  </div>
                  <h3 className="font-semibold text-white">Improvement</h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">
                  Review your feedback after each session. Small improvements compound over time.
                </p>
              </div>
            </div>
          </div>
        </div>
    </main>
  );
}
