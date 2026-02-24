'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Mic, 
  Users, 
  ArrowRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Send,
  Volume2,
  MessageSquare,
  Sparkles,
  ChevronRight,
  MicOff,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { generateInterviewQuestion, generateInterviewFeedback } from '@/lib/interviewEngine';
import { generatePanel, generatePanelQuestion } from '@/lib/presentationEngine';
import { textToSpeech, VoicePersona } from '@/lib/voice';
import { Interview, InterviewQuestion, Presentation, PanelQuestion } from '@/lib/supabase/types';
import { PanelMember } from '@/lib/presentationEngine';

// Nigerian personas
const NIGERIAN_PERSONAS = [
  {
    id: 'mrs_adebayo',
    name: 'Mrs. Adebayo',
    title: 'Lagos HR Director',
    description: 'Professional, warm, asks behavioral questions',
    voice_persona: VoicePersona.HR_INTERVIEWER,
    personality: 'warm_professional',
    image: '👩‍💼',
    accent: 'Nigerian (Lagos)',
    typical_phrases: ['I like that', 'Tell me more about yourself', 'That\'s interesting'],
    color: 'bg-green-500',
  },
  {
    id: 'alhaji_ibrahim',
    name: 'Alhaji Ibrahim',
    title: 'Abuja Bank Executive',
    description: 'Formal, direct, focuses on results',
    voice_persona: VoicePersona.CEO,
    personality: 'formal_executive',
    image: '👨‍💼',
    accent: 'Nigerian (Hausa-influenced)',
    typical_phrases: ['Time is money', 'What is your value proposition?', 'Be specific'],
    color: 'bg-amber-600',
  },
  {
    id: 'ngozi_chukwu',
    name: 'Ngozi Chukwu',
    title: 'Tech CEO',
    description: 'Sharp, no-nonsense, expects excellence',
    voice_persona: VoicePersona.TECHNICAL_LEAD,
    personality: 'sharp_direct',
    image: '👩‍💻',
    accent: 'Nigerian (Igbo-influenced)',
    typical_phrases: ['Cut to the chase', 'Show me the data', 'I need results'],
    color: 'bg-purple-600',
  },
];

export default function TestPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'presentation' ? 'presentation' : 'interview';
  
  const [activeTab, setActiveTab] = useState<'interview' | 'presentation'>(initialTab);
  
  // Interview state
  const [interviewConfig, setInterviewConfig] = useState({
    jobRole: '',
    company: '',
    experienceLevel: 'Mid-level',
    interviewType: 'general',
  });
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [interviewPersona, setInterviewPersona] = useState<any>(null);
  const [interviewHistory, setInterviewHistory] = useState<InterviewQuestion[]>([]);
  
  // Presentation state
  const [presentationConfig, setPresentationConfig] = useState({
    topic: '',
    duration: '10 minutes',
    audience: 'Executive Board',
  });
  const [presentationStarted, setPresentationStarted] = useState(false);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [panel, setPanel] = useState<PanelMember[]>([]);
  const [currentPanelMember, setCurrentPanelMember] = useState<PanelMember | null>(null);
  const [presentationQuestion, setPresentationQuestion] = useState<any>(null);
  const [presentationAnswer, setPresentationAnswer] = useState('');
  const [presentationHistory, setPresentationHistory] = useState<PanelQuestion[]>([]);
  
  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  
  // Speech recognition ref
  const recognitionRef = useRef<any>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = createClient();

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Start interview
  const startInterview = async () => {
    if (!interviewConfig.jobRole || !interviewConfig.company) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Select random persona
      const persona = NIGERIAN_PERSONAS[Math.floor(Math.random() * NIGERIAN_PERSONAS.length)];
      setInterviewPersona(persona);
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Try to create interview record, but continue even if it fails (RLS policy)
      let interviewData = null;
      try {
        const { data, error: dbError } = await supabase
          .from('interviews')
          .insert({
            user_id: user?.id || null,
            job_role: interviewConfig.jobRole,
            company: interviewConfig.company,
            experience_level: interviewConfig.experienceLevel,
            interview_type: interviewConfig.interviewType,
            status: 'in_progress',
          })
          .select()
          .single();
        
        if (!dbError) {
          interviewData = data;
        } else {
          console.warn('Could not save to database (RLS policy), continuing with local session:', dbError.message);
        }
      } catch (dbErr: any) {
        console.warn('Database error, continuing with local session:', dbErr.message);
      }
      
      // Create a local interview object even if database save failed
      setInterview(interviewData || {
        id: 'local-' + Date.now(),
        job_role: interviewConfig.jobRole,
        company: interviewConfig.company,
        experience_level: interviewConfig.experienceLevel,
        interview_type: interviewConfig.interviewType,
        status: 'in_progress',
      });
      
      // Generate first question via API
      let result;
      try {
        result = await generateInterviewQuestion(
          interviewConfig.jobRole,
          interviewConfig.company,
          interviewConfig.experienceLevel,
          interviewConfig.interviewType,
          [],
          persona
        );
      } catch (apiErr: any) {
        console.warn('API call failed, using fallback question:', apiErr);
        // Fallback question if API fails
        result = {
          question: `Tell me about your experience and why you're interested in the ${interviewConfig.jobRole} position at ${interviewConfig.company}.`,
          persona: persona,
        };
      }
      
      setCurrentQuestion(result);
      
      // Generate audio
      try {
        const audioBlobUrl = await textToSpeech(result.question, persona.voice_persona);
        setAudioUrl(audioBlobUrl);
      } catch (audioErr) {
        console.warn('Audio generation failed, continuing without audio:', audioErr);
      }
      
      setInterviewStarted(true);
    } catch (err: any) {
      console.error('Error starting interview:', err);
      setError(err.message || 'Failed to start interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit answer
  const submitAnswer = async () => {
    if (!answer.trim() || !currentQuestion || !interview) return;
    
    setIsLoading(true);
    try {
      // Generate feedback via API
      let feedbackResult;
      try {
        feedbackResult = await generateInterviewFeedback(
          currentQuestion.question,
          answer,
          interview.job_role
        );
      } catch (apiErr: any) {
        console.warn('Feedback API failed, using fallback:', apiErr);
        feedbackResult = {
          score: 7,
          strengths: 'You provided an answer to the question.',
          improvements: 'Try to be more specific and provide concrete examples from your experience.',
          improved_answer: 'A more detailed answer would include specific examples, metrics, and outcomes from your previous work.',
        };
      }
      
      setFeedback(feedbackResult);
      
      // Create local question data
      const localQuestionData = {
        id: 'local-q-' + Date.now(),
        interview_id: interview.id,
        question: currentQuestion.question,
        answer: answer,
        score: feedbackResult.score,
        feedback: feedbackResult,
        persona: interviewPersona,
        created_at: new Date().toISOString(),
      };
      
      // Try to save to database, but don't fail if RLS blocks it
      try {
        const { data: questionData, error } = await supabase
          .from('questions')
          .insert({
            interview_id: interview.id,
            question: currentQuestion.question,
            answer: answer,
            score: feedbackResult.score,
            feedback: feedbackResult,
            persona: interviewPersona,
          })
          .select()
          .single();
        
        if (!error && questionData) {
          setInterviewHistory(prev => [...prev, questionData]);
        } else {
          setInterviewHistory(prev => [...prev, localQuestionData as any]);
        }
        
        // Update interview score (best effort)
        await supabase
          .from('interviews')
          .update({ score: feedbackResult.score })
          .eq('id', interview.id);
      } catch (dbErr: any) {
        console.warn('Database save failed, using local data:', dbErr.message);
        setInterviewHistory(prev => [...prev, localQuestionData as any]);
      }
      
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      setError(error.message || 'Failed to submit answer');
    } finally {
      setIsLoading(false);
    }
  };

  // Next question
  const nextQuestion = async () => {
    if (!interview) return;
    
    setIsLoading(true);
    setAnswer('');
    setFeedback(null);
    setAudioUrl(null);
    
    try {
      const previousQuestions = interviewHistory.map(q => q.question);
      
      const result = await generateInterviewQuestion(
        interview.job_role,
        interview.company,
        interview.experience_level,
        interview.interview_type,
        previousQuestions,
        interviewPersona
      );
      
      setCurrentQuestion(result);
      
      const audioBlobUrl = await textToSpeech(result.question, interviewPersona.voice_persona);
      setAudioUrl(audioBlobUrl);
    } catch (error) {
      console.error('Error getting next question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // End session
  const endSession = () => {
    setSessionComplete(true);
  };

  // Start presentation
  const startPresentation = async () => {
    if (!presentationConfig.topic) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Try to create presentation record, but continue even if it fails (RLS policy)
      let presentationData = null;
      try {
        const { data, error } = await supabase
          .from('presentations')
          .insert({
            user_id: user?.id || null,
            topic: presentationConfig.topic,
            presentation_type: presentationConfig.audience,
            duration: presentationConfig.duration,
            status: 'in_progress',
          })
          .select()
          .single();
        
        if (!error) {
          presentationData = data;
        } else {
          console.warn('Could not save to database (RLS policy), continuing with local session:', error.message);
        }
      } catch (dbErr: any) {
        console.warn('Database error, continuing with local session:', dbErr.message);
      }
      
      // Create a local presentation object even if database save failed
      setPresentation(presentationData || {
        id: 'local-pres-' + Date.now(),
        topic: presentationConfig.topic,
        presentation_type: presentationConfig.audience,
        duration: presentationConfig.duration,
        status: 'in_progress',
      });
      
      // Generate panel
      const panelMembers = await generatePanel();
      setPanel(panelMembers);
      
      // First panel member asks question
      const firstMember = panelMembers[0];
      setCurrentPanelMember(firstMember);
      
      const result = await generatePanelQuestion(firstMember, presentationConfig.topic);
      setPresentationQuestion(result);
      
      // Generate audio (best effort)
      try {
        const audioBlobUrl = await textToSpeech(result.question, firstMember.voice_persona);
        setAudioUrl(audioBlobUrl);
      } catch (audioErr) {
        console.warn('Audio generation failed, continuing without audio:', audioErr);
      }
      
      setPresentationStarted(true);
    } catch (err: any) {
      console.error('Error starting presentation:', err);
      setError(err.message || 'Failed to start presentation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit presentation answer
  const submitPresentationAnswer = async () => {
    if (!presentationAnswer.trim() || !presentationQuestion || !presentation || !currentPanelMember) return;
    
    setIsLoading(true);
    try {
      // Create local question data
      const localQuestionData = {
        id: 'local-pq-' + Date.now(),
        presentation_id: presentation.id,
        panel_member: currentPanelMember,
        question: presentationQuestion.question,
        answer: presentationAnswer,
        score: presentationQuestion.score || 7,
        feedback: presentationQuestion.feedback || 'Your answer was recorded.',
        created_at: new Date().toISOString(),
      };
      
      // Try to save to database, but don't fail if RLS blocks it
      try {
        const { data: questionData, error } = await supabase
          .from('panel_questions')
          .insert({
            presentation_id: presentation.id,
            panel_member: currentPanelMember,
            question: presentationQuestion.question,
            answer: presentationAnswer,
            score: presentationQuestion.score,
            feedback: presentationQuestion.feedback,
          })
          .select()
          .single();
        
        if (!error && questionData) {
          setPresentationHistory(prev => [...prev, questionData]);
        } else {
          setPresentationHistory(prev => [...prev, localQuestionData as any]);
        }
        
        // Update presentation score (best effort)
        await supabase
          .from('presentations')
          .update({ score: presentationQuestion.score })
          .eq('id', presentation.id);
      } catch (dbErr: any) {
        console.warn('Database save failed, using local data:', dbErr.message);
        setPresentationHistory(prev => [...prev, localQuestionData as any]);
      }
      
    } catch (error: any) {
      console.error('Error submitting presentation answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Next presentation question (rotates to next panel member)
  const nextPresentationQuestion = async () => {
    if (!presentation || !currentPanelMember) return;
    
    setIsLoading(true);
    setPresentationAnswer('');
    setPresentationQuestion(null);
    setAudioUrl(null);
    
    try {
      // Rotate to next panel member
      const currentIndex = panel.findIndex(m => m.id === currentPanelMember.id);
      const nextIndex = (currentIndex + 1) % panel.length;
      const nextMember = panel[nextIndex];
      setCurrentPanelMember(nextMember);
      
      const previousQuestions = presentationHistory.map(q => q.question);
      
      const result = await generatePanelQuestion(nextMember, presentationConfig.topic, previousQuestions);
      setPresentationQuestion(result);
      
      const audioBlobUrl = await textToSpeech(result.question, nextMember.voice_persona);
      setAudioUrl(audioBlobUrl);
    } catch (error) {
      console.error('Error getting next presentation question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Play audio
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Voice input (Speech-to-Text)
  const toggleVoiceInput = () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setAnswer((prev) => prev + finalTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // Voice input for presentation (updates different state)
  const toggleVoiceInputPresentation = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        setPresentationAnswer((prev) => prev + finalTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600 bg-emerald-100';
    if (score >= 6) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  // Session complete view
  if (sessionComplete) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-charcoal mb-4">Session Complete!</h2>
          <p className="text-gray-500 mb-8">
            Great job! You&apos;ve completed your {activeTab === 'interview' ? 'interview' : 'presentation'} practice session.
            Review your feedback to improve your skills.
          </p>
          
          <div className="bg-linen rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-charcoal mb-4">Session Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Questions Answered</p>
                <p className="text-2xl font-bold text-charcoal">
                  {activeTab === 'interview' ? interviewHistory.length : presentationHistory.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-charcoal">
                  {(() => {
                    const history = activeTab === 'interview' ? interviewHistory : presentationHistory;
                    const avg = history.reduce((acc, q) => acc + (q.score || 0), 0) / (history.length || 1);
                    return Math.round(avg * 10) / 10;
                  })()}/10
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/feedback">
              <Button className="bg-wood hover:bg-wood-dark text-white rounded-full px-8">
                View Detailed Feedback
              </Button>
            </a>
            <Button 
              variant="outline" 
              className="rounded-full px-8 border-wood text-wood hover:bg-wood hover:text-white"
              onClick={() => window.location.reload()}
            >
              Start New Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      {!interviewStarted && !presentationStarted && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Practice Session</h1>
          <p className="text-gray-500">Choose your practice mode and configure your session</p>
        </div>
      )}

      {/* Mode Selection Tabs */}
      {!interviewStarted && !presentationStarted && (
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full p-1 shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveTab('interview')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                activeTab === 'interview' 
                  ? 'bg-wood text-white' 
                  : 'text-gray-500 hover:text-charcoal'
              }`}
            >
              <Mic className="w-4 h-4" />
              Interview
            </button>
            <button
              onClick={() => setActiveTab('presentation')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                activeTab === 'presentation' 
                  ? 'bg-wood text-white' 
                  : 'text-gray-500 hover:text-charcoal'
              }`}
            >
              <Users className="w-4 h-4" />
              Presentation
            </button>
          </div>
        </div>
      )}

      {/* Interview Setup */}
      {activeTab === 'interview' && !interviewStarted && (
        <Card className="rounded-3xl shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-wood/10 rounded-xl flex items-center justify-center">
                <Mic className="w-6 h-6 text-wood" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-charcoal">Interview Configuration</h2>
                <p className="text-sm text-gray-500">Set up your practice interview parameters</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="jobRole">Job Role</Label>
                <Input
                  id="jobRole"
                  placeholder="e.g., Software Engineer, Marketing Manager"
                  value={interviewConfig.jobRole}
                  onChange={(e) => setInterviewConfig(prev => ({ ...prev, jobRole: e.target.value }))}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="e.g., Google, GTBank, KPMG"
                  value={interviewConfig.company}
                  onChange={(e) => setInterviewConfig(prev => ({ ...prev, company: e.target.value }))}
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <select
                  id="experienceLevel"
                  value={interviewConfig.experienceLevel}
                  onChange={(e) => setInterviewConfig(prev => ({ ...prev, experienceLevel: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-charcoal focus:ring-2 focus:ring-wood focus:border-transparent"
                >
                  <option value="Entry-level">Entry-level (0-2 years)</option>
                  <option value="Mid-level">Mid-level (3-5 years)</option>
                  <option value="Senior">Senior (6+ years)</option>
                  <option value="Executive">Executive/C-level</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interviewType">Interview Type</Label>
                <select
                  id="interviewType"
                  value={interviewConfig.interviewType}
                  onChange={(e) => setInterviewConfig(prev => ({ ...prev, interviewType: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-charcoal focus:ring-2 focus:ring-wood focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="technical">Technical</option>
                  <option value="case_study">Case Study</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}
            <Button
              onClick={startInterview}
              disabled={!interviewConfig.jobRole || !interviewConfig.company || isLoading}
              className="w-full bg-wood hover:bg-wood-dark text-white rounded-full py-6 text-lg font-semibold disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Interview
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Presentation Setup */}
      {activeTab === 'presentation' && !presentationStarted && (
        <Card className="rounded-3xl shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-wood/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-wood" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-charcoal">Presentation Configuration</h2>
                <p className="text-sm text-gray-500">Set up your panel presentation simulation</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Presentation Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Q4 Financial Results, Product Launch Strategy"
                value={presentationConfig.topic}
                onChange={(e) => setPresentationConfig(prev => ({ ...prev, topic: e.target.value }))}
                className="rounded-xl border-gray-200"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <select
                  id="duration"
                  value={presentationConfig.duration}
                  onChange={(e) => setPresentationConfig(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-charcoal focus:ring-2 focus:ring-wood focus:border-transparent"
                >
                  <option value="5 minutes">5 minutes</option>
                  <option value="10 minutes">10 minutes</option>
                  <option value="15 minutes">15 minutes</option>
                  <option value="30 minutes">30 minutes</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <select
                  id="audience"
                  value={presentationConfig.audience}
                  onChange={(e) => setPresentationConfig(prev => ({ ...prev, audience: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-charcoal focus:ring-2 focus:ring-wood focus:border-transparent"
                >
                  <option value="Executive Board">Executive Board</option>
                  <option value="Investors">Investors</option>
                  <option value="Team Members">Team Members</option>
                  <option value="Clients">Clients</option>
                </select>
              </div>
            </div>

            <div className="bg-wood/10 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-wood flex-shrink-0 mt-0.5" />
                <p className="text-sm text-charcoal">
                  <span className="font-semibold">AI Panel Members:</span> You&apos;ll face a 3-person panel 
                  including a CEO, HR Director, and Technical Lead — each with distinct personalities and questioning styles.
                </p>
              </div>
            </div>

            <Button
              onClick={startPresentation}
              disabled={!presentationConfig.topic || isLoading}
              className="w-full bg-wood hover:bg-wood-dark text-white rounded-full py-6 text-lg font-semibold disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Presentation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Interview Session */}
      {interviewStarted && currentQuestion && interviewPersona && (
        <div className="space-y-6">
          {/* Persona Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 ${interviewPersona.color} rounded-2xl flex items-center justify-center text-3xl`}>
                {interviewPersona.image}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-charcoal text-lg">{interviewPersona.name}</h3>
                <p className="text-gray-500">{interviewPersona.title}</p>
              </div>
              <div className="text-right">
                <span className="text-xs px-3 py-1 bg-wood/10 rounded-full text-wood font-medium">
                  {interviewPersona.accent}
                </span>
              </div>
            </div>
            {audioUrl && (
              <div className="mt-4 flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAudio}
                  className="rounded-full border-wood text-wood hover:bg-wood hover:text-white"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="ml-2">{isPlaying ? 'Pause' : 'Play'} Question</span>
                </Button>
                <span className="text-sm text-gray-500">
                  {isPlaying ? 'Playing...' : 'Click to hear the question'}
                </span>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  autoPlay
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-wood" />
              <span className="text-sm font-medium text-wood uppercase tracking-wide">Question</span>
            </div>
            <p className="text-xl text-charcoal leading-relaxed">{currentQuestion.question}</p>
          </div>

          {/* Answer Input */}
          {!feedback && (
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Type your answer here... (Or click the mic button to speak)"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="min-h-[150px] rounded-2xl border-gray-200 text-lg pr-14"
                />
                {/* Voice Input Button */}
                <button
                  onClick={toggleVoiceInput}
                  disabled={isLoading}
                  className={`absolute right-3 bottom-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-wood/10 text-wood hover:bg-wood hover:text-white'
                  }`}
                  title={isRecording ? 'Click to stop recording' : 'Click to speak your answer'}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>
              {isRecording && (
                <p className="text-sm text-wood text-center animate-pulse">
                  🎤 Recording... Speak your answer and click the mic button to stop
                </p>
              )}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={endSession}
                  className="rounded-full border-gray-200 text-gray-500"
                >
                  End Session
                </Button>
                <Button
                  onClick={submitAnswer}
                  disabled={!answer.trim() || isLoading}
                  className="bg-wood hover:bg-wood-dark text-white rounded-full px-8"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit Answer
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-wood" />
                  <h3 className="text-xl font-bold text-charcoal">AI Feedback</h3>
                </div>
                <span className={`px-4 py-2 rounded-full text-xl font-bold ${getScoreColor(feedback.score)}`}>
                  {feedback.score}/10
                </span>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-charcoal mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Strengths
                  </h4>
                  <p className="text-gray-600 bg-emerald-50 rounded-xl p-4">{feedback.strengths}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-charcoal mb-2 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    Areas for Improvement
                  </h4>
                  <p className="text-gray-600 bg-amber-50 rounded-xl p-4">{feedback.improvements}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-charcoal mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-wood" />
                    Improved Answer
                  </h4>
                  <p className="text-gray-600 bg-wood/10 rounded-xl p-4">{feedback.improved_answer}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={endSession}
                  className="rounded-full border-gray-200 text-gray-500"
                >
                  End Session
                </Button>
                <Button
                  onClick={nextQuestion}
                  disabled={isLoading}
                  className="bg-wood hover:bg-wood-dark text-white rounded-full px-8"
                >
                  Next Question
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Presentation Session */}
      {presentationStarted && presentationQuestion && currentPanelMember && (
        <div className="space-y-6">
          {/* Panel Members */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-charcoal mb-4">Your Panel</h3>
            <div className="flex flex-wrap gap-4">
              {panel.map((member) => (
                <div 
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    member.id === currentPanelMember.id 
                      ? 'bg-wood/10 ring-2 ring-wood' 
                      : 'bg-linen'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    member.role === 'CEO' ? 'bg-amber-600' :
                    member.role === 'CFO' ? 'bg-green-600' :
                    member.role === 'HR Director' ? 'bg-blue-600' : 'bg-purple-600'
                  }`}>
                    {member.role[0]}
                  </div>
                  <div>
                    <p className="font-medium text-charcoal text-sm">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
            {audioUrl && (
              <div className="mt-4 flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAudio}
                  className="rounded-full border-wood text-wood hover:bg-wood hover:text-white"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="ml-2">{isPlaying ? 'Pause' : 'Play'} Audio</span>
                </Button>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-wood" />
              <span className="text-sm font-medium text-wood uppercase tracking-wide">
                {currentPanelMember.name} asks:
              </span>
            </div>
            <p className="text-xl text-charcoal leading-relaxed">{presentationQuestion.question}</p>
          </div>

          {/* Answer Input */}
          {!presentationHistory.find(q => q.question === presentationQuestion?.question) && (
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Type your answer here... (Or click the mic button to speak)"
                  value={presentationAnswer}
                  onChange={(e) => setPresentationAnswer(e.target.value)}
                  className="min-h-[150px] rounded-2xl border-gray-200 text-lg pr-14"
                />
                {/* Voice Input Button */}
                <button
                  onClick={toggleVoiceInputPresentation}
                  disabled={isLoading}
                  className={`absolute right-3 bottom-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-wood/10 text-wood hover:bg-wood hover:text-white'
                  }`}
                  title={isRecording ? 'Click to stop recording' : 'Click to speak your answer'}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>
              {isRecording && (
                <p className="text-sm text-wood text-center animate-pulse">
                  🎤 Recording... Speak your answer and click the mic button to stop
                </p>
              )}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={endSession}
                  className="rounded-full border-gray-200 text-gray-500"
                >
                  End Session
                </Button>
                <Button
                  onClick={submitPresentationAnswer}
                  disabled={!presentationAnswer.trim() || isLoading}
                  className="bg-wood hover:bg-wood-dark text-white rounded-full px-8"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit Answer
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Feedback */}
          {presentationHistory.find(q => q.question === presentationQuestion?.question) && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-wood" />
                  <h3 className="text-xl font-bold text-charcoal">AI Feedback</h3>
                </div>
                <span className={`px-4 py-2 rounded-full text-xl font-bold ${getScoreColor(presentationQuestion.score || 0)}`}>
                  {presentationQuestion.score}/10
                </span>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-charcoal mb-2">Feedback</h4>
                  <p className="text-gray-600 bg-wood/10 rounded-xl p-4">{presentationQuestion.feedback}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={endSession}
                  className="rounded-full border-gray-200 text-gray-500"
                >
                  End Session
                </Button>
                <Button
                  onClick={nextPresentationQuestion}
                  disabled={isLoading}
                  className="bg-wood hover:bg-wood-dark text-white rounded-full px-8"
                >
                  Next Question
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
