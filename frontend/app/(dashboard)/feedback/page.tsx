'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Mic, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Star,
  Calendar,
  Building2,
  Briefcase,
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Interview, InterviewQuestion, Presentation, PanelQuestion } from '@/lib/supabase/types';

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<'interviews' | 'presentations'>('interviews');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [interviewQuestions, setInterviewQuestions] = useState<Record<string, InterviewQuestion[]>>({});
  const [panelQuestions, setPanelQuestions] = useState<Record<string, PanelQuestion[]>>({});
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch interviews with questions
      const { data: interviewsData } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const interviews = (interviewsData || []) as Interview[];
      setInterviews(interviews);

      // Fetch questions for each interview
      const questionsMap: Record<string, InterviewQuestion[]> = {};
      for (const interview of interviews) {
        const { data: questions } = await supabase
          .from('questions')
          .select('*')
          .eq('interview_id', interview.id)
          .order('created_at', { ascending: true });
        questionsMap[interview.id] = (questions || []) as InterviewQuestion[];
      }
      setInterviewQuestions(questionsMap);

      // Fetch presentations with panel questions
      const { data: presentationsData } = await supabase
        .from('presentations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const presentations = (presentationsData || []) as Presentation[];
      setPresentations(presentations);

      // Fetch panel questions for each presentation
      const panelQuestionsMap: Record<string, PanelQuestion[]> = {};
      for (const presentation of presentations) {
        const { data: questions } = await supabase
          .from('panel_questions')
          .select('*')
          .eq('presentation_id', presentation.id)
          .order('created_at', { ascending: true });
        panelQuestionsMap[presentation.id] = (questions || []) as PanelQuestion[];
      }
      setPanelQuestions(panelQuestionsMap);
    } catch (error) {
      console.error('Error fetching feedback data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'bg-gray-100';
    if (score >= 8) return 'bg-emerald-100';
    if (score >= 6) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const getScoreLabel = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'Not Scored';
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    return 'Needs Work';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-12 h-12 border-4 border-wood border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Interview Detail View
  if (selectedInterview) {
    const questions = interviewQuestions[selectedInterview.id] || [];
    const avgScore = questions.length > 0
      ? Math.round((questions.reduce((acc, q) => acc + (q.score || 0), 0) / questions.length) * 10) / 10
      : null;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => setSelectedInterview(null)}
          className="text-gray-500 hover:text-charcoal"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to History
        </Button>

        {/* Session Header */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-charcoal mb-2">{selectedInterview.job_role}</h1>
              <div className="flex items-center gap-4 text-gray-500">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {selectedInterview.company}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedInterview.created_at!).toLocaleDateString()}
                </span>
              </div>
            </div>
            {avgScore !== null && (
              <div className="text-center">
                <span className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>
                  {avgScore}
                </span>
                <p className="text-sm text-gray-500">/10 avg</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-linen rounded-full text-sm text-charcoal">
              {selectedInterview.experience_level}
            </span>
            <span className="px-3 py-1 bg-linen rounded-full text-sm text-charcoal capitalize">
              {selectedInterview.interview_type}
            </span>
            <span className="px-3 py-1 bg-wood/10 rounded-full text-sm text-wood">
              {questions.length} questions
            </span>
          </div>
        </div>

        {/* Questions & Feedback */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-wood/10 rounded-lg flex items-center justify-center text-sm font-bold text-wood">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold text-charcoal">Question</h3>
                </div>
                {question.score !== null && (
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreBg(question.score)} ${getScoreColor(question.score)}`}>
                      {question.score}/10
                    </span>
                  </div>
                )}
              </div>

              <p className="text-charcoal mb-6 bg-linen rounded-xl p-4">{question.question}</p>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Your Answer</h4>
                  <p className="text-charcoal bg-gray-50 rounded-xl p-4">{question.answer}</p>
                </div>

                {question.feedback && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-emerald-600 mb-2 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Strengths
                        </h4>
                        <p className="text-gray-600 bg-emerald-50 rounded-xl p-3 text-sm">
                          {question.feedback.strengths}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-amber-600 mb-2 flex items-center gap-1">
                          <RotateCcw className="w-4 h-4" />
                          Improvements
                        </h4>
                        <p className="text-gray-600 bg-amber-50 rounded-xl p-3 text-sm">
                          {question.feedback.improvements}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-wood mb-2 flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        Improved Answer
                      </h4>
                      <p className="text-charcoal bg-wood/10 rounded-xl p-4 text-sm">
                        {question.feedback.improved_answer}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {questions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No questions answered in this session yet.</p>
          </div>
        )}
      </div>
    );
  }

  // Presentation Detail View
  if (selectedPresentation) {
    const questions = panelQuestions[selectedPresentation.id] || [];
    const avgScore = questions.length > 0
      ? Math.round((questions.reduce((acc, q) => acc + (q.score || 0), 0) / questions.length) * 10) / 10
      : null;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => setSelectedPresentation(null)}
          className="text-gray-500 hover:text-charcoal"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to History
        </Button>

        {/* Session Header */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-charcoal mb-2">{selectedPresentation.topic}</h1>
              <div className="flex items-center gap-4 text-gray-500">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {selectedPresentation.presentation_type}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedPresentation.created_at!).toLocaleDateString()}
                </span>
              </div>
            </div>
            {avgScore !== null && (
              <div className="text-center">
                <span className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>
                  {avgScore}
                </span>
                <p className="text-sm text-gray-500">/10 avg</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-linen rounded-full text-sm text-charcoal">
              {selectedPresentation.duration}
            </span>
            <span className="px-3 py-1 bg-wood/10 rounded-full text-sm text-wood">
              {questions.length} questions
            </span>
          </div>
        </div>

        {/* Questions & Feedback */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-wood/10 rounded-lg flex items-center justify-center text-sm font-bold text-wood">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-charcoal">Panel Question</h3>
                    {question.panel_member && (
                      <p className="text-sm text-gray-500">
                        {question.panel_member.name} · {question.panel_member.role}
                      </p>
                    )}
                  </div>
                </div>
                {question.score !== null && (
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreBg(question.score)} ${getScoreColor(question.score)}`}>
                    {question.score}/10
                  </span>
                )}
              </div>

              <p className="text-charcoal mb-6 bg-linen rounded-xl p-4">{question.question}</p>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Your Answer</h4>
                  <p className="text-charcoal bg-gray-50 rounded-xl p-4">{question.answer}</p>
                </div>

                {question.feedback && (
                  <div>
                    <h4 className="text-sm font-medium text-wood mb-2 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Feedback
                    </h4>
                    <p className="text-charcoal bg-wood/10 rounded-xl p-4 text-sm">
                      {typeof question.feedback === 'string' ? question.feedback : JSON.stringify(question.feedback)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {questions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No questions answered in this session yet.</p>
          </div>
        )}
      </div>
    );
  }

  // Main List View
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Feedback History</h1>
          <p className="text-gray-500 mt-1">Review your past practice sessions and track your progress</p>
        </div>
        <Link href="/saphira-interview">
          <Button className="bg-wood hover:bg-wood-dark text-white rounded-full">
            Start New Session
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('interviews')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
            activeTab === 'interviews' 
              ? 'bg-wood text-white' 
              : 'bg-white text-gray-500 hover:text-charcoal border border-gray-200'
          }`}
        >
          <Mic className="w-4 h-4" />
          Interviews ({interviews.length})
        </button>
        <button
          onClick={() => setActiveTab('presentations')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
            activeTab === 'presentations' 
              ? 'bg-wood text-white' 
              : 'bg-white text-gray-500 hover:text-charcoal border border-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Presentations ({presentations.length})
        </button>
      </div>

      {/* Interview List */}
      {activeTab === 'interviews' && (
        <div className="space-y-4">
          {interviews.length > 0 ? (
            interviews.map((interview) => {
              const questions = interviewQuestions[interview.id] || [];
              const avgScore = questions.length > 0
                ? Math.round((questions.reduce((acc, q) => acc + (q.score || 0), 0) / questions.length) * 10) / 10
                : null;

              return (
                <div
                  key={interview.id}
                  onClick={() => setSelectedInterview(interview)}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-charcoal text-lg">{interview.job_role}</h3>
                        <span className="px-2 py-0.5 bg-linen rounded-full text-xs text-gray-600">
                          {interview.experience_level}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-500 text-sm">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {interview.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(interview.created_at!).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {questions.length} questions
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {avgScore !== null ? (
                        <div className="text-right">
                          <span className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                            {avgScore}
                          </span>
                          <p className="text-xs text-gray-400">/10</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">In Progress</span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-wood/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-wood" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">No interviews yet</h3>
              <p className="text-gray-500 mb-6">Start your first practice interview to see feedback here</p>
              <Link href="/saphira-interview">
                <Button className="bg-wood hover:bg-wood-dark text-white rounded-full">
                  Start Interview
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Presentation List */}
      {activeTab === 'presentations' && (
        <div className="space-y-4">
          {presentations.length > 0 ? (
            presentations.map((presentation) => {
              const questions = panelQuestions[presentation.id] || [];
              const avgScore = questions.length > 0
                ? Math.round((questions.reduce((acc, q) => acc + (q.score || 0), 0) / questions.length) * 10) / 10
                : null;

              return (
                <div
                  key={presentation.id}
                  onClick={() => setSelectedPresentation(presentation)}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-charcoal text-lg">{presentation.topic}</h3>
                        <span className="px-2 py-0.5 bg-linen rounded-full text-xs text-gray-600">
                          {presentation.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-500 text-sm">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {presentation.presentation_type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(presentation.created_at!).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {questions.length} questions
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {avgScore !== null ? (
                        <div className="text-right">
                          <span className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                            {avgScore}
                          </span>
                          <p className="text-xs text-gray-400">/10</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">In Progress</span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-wood/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-wood" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">No presentations yet</h3>
              <p className="text-gray-500 mb-6">Start your first panel presentation to see feedback here</p>
              <Link href="/presentation">
                <Button className="bg-wood hover:bg-wood-dark text-white rounded-full">
                  Start Presentation
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
