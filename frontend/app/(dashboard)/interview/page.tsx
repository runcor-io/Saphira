'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, PhoneOff, Clock, ChevronLeft, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  InterviewStage,
  createInterviewContext,
  getNextInterviewerMessage,
  getInterviewerVoiceId,
  InterviewContext,
} from '@/lib/interviewFlow';
import { storeAnswer } from '@/lib/interviewMemory';

// Waveform animation
function WaveformAnimation({ isActive }: { isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      timeRef.current += 0.03;
      const time = timeRef.current;
      ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
      const centerX = canvas.offsetWidth / 2;
      const centerY = canvas.offsetHeight / 2;

      for (let ring = 0; ring < 5; ring++) {
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i <= 360; i += 5) {
          const angle = (i * Math.PI) / 180;
          const wave = Math.sin(angle * 4 + time + ring * 0.5) * (isActive ? 20 : 5);
          const radius = 60 + ring * 25 + wave;
          points.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          });
        }
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const xc = (points[i].x + points[i - 1].x) / 2;
          const yc = (points[i].y + points[i - 1].y) / 2;
          ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
        ctx.closePath();
        ctx.strokeStyle = '#8B5A2B';
        ctx.lineWidth = 2;
        ctx.globalAlpha = isActive ? 0.6 + Math.sin(time) * 0.2 : 0.2;
        ctx.stroke();
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
  stage?: InterviewStage;
  isAIGenerated?: boolean;
  question?: string; // Store the question that was asked
}

interface FeedbackData {
  score: number;
  rating: string;
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
  feedback: string;
}

interface InterviewSummary {
  overallScore: number;
  overallRating: string;
  hiringRecommendation: string;
  keyStrengths: string[];
  areasToImprove: string[];
  performanceHighlights: string;
  developmentPlan: string;
  summary: string;
}

// Nigerian voice IDs
const NIGERIAN_VOICES: Record<string, string> = {
  Tunde: 'tj0Lij6AHHeCO5FylYzu', // Authoritative male
  Ibrahim: '77aEIu0qStu8Jwv1EdhX',
  Bayo: '9hEb6p6ZCFsloAWErEvE',
  Emeka: 'U7wWSnxIJwCjioxt86mk',
  Chidi: '77aEIu0qStu8Jwv1EdhX',
  Chioma: 'Y4Xi1YBz9HedbrvzwylK', // Nigerian female
  Aisha: 'Y4Xi1YBz9HedbrvzwylK', // Nigerian female
  Ngozi: 'Y4Xi1YBz9HedbrvzwylK', // Nigerian female
  Funmi: 'Y4Xi1YBz9HedbrvzwylK', // Nigerian female
  Amaka: 'Y4Xi1YBz9HedbrvzwylK', // Nigerian female
};

export default function InterviewPage() {
  const router = useRouter();
  const [config, setConfig] = useState({ jobRole: '', company: '' });
  const [showConfig, setShowConfig] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  
  // Interview context
  const [interviewContext, setInterviewContext] = useState<InterviewContext | null>(null);
  const [currentStage, setCurrentStage] = useState<InterviewStage>(InterviewStage.INTRODUCTION);
  
  // Selected interviewer
  const [selectedInterviewer, setSelectedInterviewer] = useState<{name: string; gender: 'male' | 'female'} | null>(null);
  
  // Feedback and scoring
  const [feedbacks, setFeedbacks] = useState<Record<number, FeedbackData>>({});
  const [scores, setScores] = useState<number[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackData | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [interviewSummary, setInterviewSummary] = useState<InterviewSummary | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const lastQuestionRef = useRef<string>('');
  
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer
  useEffect(() => {
    if (!showConfig) {
      const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [showConfig]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pick a random interviewer
  const pickRandomInterviewer = useCallback(() => {
    const isMale = Math.random() > 0.5;
    const names = isMale ? ['Tunde', 'Ibrahim', 'Bayo', 'Emeka', 'Chidi'] : ['Chioma', 'Aisha', 'Ngozi', 'Funmi', 'Amaka'];
    const name = names[Math.floor(Math.random() * names.length)];
    return { name, gender: isMale ? 'male' as const : 'female' as const };
  }, []);

  // Initialize interviewer when form is filled
  useEffect(() => {
    if (config.jobRole && config.company && !selectedInterviewer) {
      setSelectedInterviewer(pickRandomInterviewer());
    }
  }, [config.jobRole, config.company, selectedInterviewer, pickRandomInterviewer]);

  // Get voice ID for interviewer name
  const getVoiceId = (name: string): string => {
    return NIGERIAN_VOICES[name] || NIGERIAN_VOICES.Tunde;
  };

  // Browser TTS fallback
  const speakWithBrowserVoice = useCallback((text: string, onEnd?: () => void) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang === 'en-GB') || voices[0];
    if (voice) utterance.voice = voice;
    
    utterance.onstart = () => {
      setIsAiSpeaking(true);
      setVoiceStatus('playing');
    };
    
    utterance.onend = () => {
      setIsAiSpeaking(false);
      setVoiceStatus('idle');
      onEnd?.();
    };
    
    utterance.onerror = () => {
      setIsAiSpeaking(false);
      setVoiceStatus('error');
      onEnd?.();
    };
    
    window.speechSynthesis.speak(utterance);
  }, []);

  // Speak with ElevenLabs
  const speakWithElevenLabs = useCallback(async (text: string, voiceId: string, onEnd?: () => void) => {
    try {
      console.log('[ElevenLabs] Using voice ID:', voiceId);
      
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      const audioBlob = await response.blob();
      console.log('[ElevenLabs] Audio received:', audioBlob.size, 'bytes');
      
      if (audioBlob.size === 0) {
        throw new Error('Empty audio');
      }
      
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.volume = 1.0;
      audioRef.current = audio;
      
      audio.onplay = () => {
        setVoiceStatus('playing');
      };
      
      audio.onended = () => {
        setIsAiSpeaking(false);
        setVoiceStatus('idle');
        URL.revokeObjectURL(url);
        onEnd?.();
      };
      
      audio.onerror = () => {
        setIsAiSpeaking(false);
        setVoiceStatus('error');
        URL.revokeObjectURL(url);
        speakWithBrowserVoice(text, onEnd);
      };
      
      await audio.play();
      
    } catch (err: any) {
      console.error('[ElevenLabs] Failed:', err.message);
      speakWithBrowserVoice(text, onEnd);
    }
  }, [speakWithBrowserVoice]);

  // Main speak function
  const speakText = useCallback(async (text: string, onEnd?: () => void) => {
    if (isMuted) {
      onEnd?.();
      return;
    }
    
    setIsAiSpeaking(true);
    setVoiceStatus('loading');
    
    // Determine which voice to use
    let interviewerName = selectedInterviewer?.name;
    if (interviewContext) {
      interviewerName = interviewContext.interviewerName;
    }
    
    if (!interviewerName) {
      console.log('[Speak] No interviewer selected, using browser');
      speakWithBrowserVoice(text, onEnd);
      return;
    }
    
    const voiceId = getVoiceId(interviewerName);
    console.log('[Speak] Interviewer:', interviewerName, 'Voice ID:', voiceId);
    
    await speakWithElevenLabs(text, voiceId, onEnd);
  }, [isMuted, selectedInterviewer, interviewContext, speakWithBrowserVoice, speakWithElevenLabs]);

  // Generate feedback for candidate answer
  const generateFeedback = async (question: string, answer: string, questionNumber: number) => {
    try {
      console.log('[Feedback] Generating feedback for Q', questionNumber);
      
      const response = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          answer,
          jobRole: interviewContext?.jobRole || config.jobRole,
          stage: currentStage,
          questionNumber,
          totalQuestions: interviewContext?.maxQuestions || 8,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate feedback');
      }
      
      const data = await response.json();
      
      setFeedbacks(prev => ({ ...prev, [questionNumber]: data }));
      setScores(prev => [...prev, data.score]);
      setCurrentFeedback(data);
      setShowFeedback(true);
      
      console.log('[Feedback] Score:', data.score, '-', data.rating);
      
    } catch (err) {
      console.error('[Feedback] Error:', err);
    }
  };

  // Generate interview summary
  const generateSummary = async () => {
    if (!interviewContext) return;
    
    try {
      console.log('[Summary] Generating final report...');
      
      // Build transcript
      const transcript = messages
        .filter(m => m.sender === 'user')
        .map((m, i) => `Q${i + 1}: ${m.question || 'Question'}\nA: ${m.text}`)
        .join('\n\n');
      
      const response = await fetch('/api/interview/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobRole: interviewContext.jobRole,
          company: interviewContext.company,
          candidateName: interviewContext.candidateName,
          interviewTranscript: transcript,
          scores,
          totalQuestions: interviewContext.questionCount,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }
      
      const data = await response.json();
      setInterviewSummary(data);
      setShowSummary(true);
      
      console.log('[Summary] Overall:', data.overallRating, '-', data.hiringRecommendation);
      
    } catch (err) {
      console.error('[Summary] Error:', err);
    }
  };

  // Check if message is an interruption (should not get feedback)
  const isInterruptionMessage = (message: string): boolean => {
    const lower = message.toLowerCase().trim();
    
    // Hearing checks
    if (lower.includes('can you hear me') ||
        lower.includes('are you there') ||
        lower.includes('do you hear me') ||
        lower.includes('can you hear us')) return true;
    
    // Repeat requests
    if (lower.includes('repeat') ||
        lower.includes('say that again') ||
        lower.includes('pardon') ||
        lower.includes('what did you say') ||
        lower.includes('i didn\'t hear')) return true;
    
    // Wait/pause requests
    if (lower.includes('wait') ||
        lower.includes('hold on') ||
        lower.includes('one moment') ||
        lower.includes('give me a second') ||
        lower.includes('just a minute')) return true;
    
    // Greetings that aren't answers (short)
    if ((lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) && 
        message.length < 25) return true;
    
    // Very short non-answers
    if (message.split(' ').length <= 2 && 
        (lower === 'yes' || lower === 'no' || lower === 'okay' || lower === 'ok')) return true;
    
    return false;
  };

  // Process candidate message - defined after startListening to avoid circular dep
  const processCandidateMessageRef = useRef<(msg: string) => Promise<void>>();
  
  const processCandidateMessage = async (candidateMessage: string) => {
    if (!interviewContext) return;
    
    const currentQuestion = lastQuestionRef.current;
    const questionNumber = interviewContext.questionCount;
    
    // Check if this is just an interruption - don't store or give feedback
    if (isInterruptionMessage(candidateMessage)) {
      console.log('[Process] Interruption detected, no feedback:', candidateMessage);
      
      // Get response but don't store in history
      const { message, updatedContext } = await getNextInterviewerMessage({
        context: interviewContext,
        candidateMessage,
      });
      
      setInterviewContext(updatedContext);
      setCurrentStage(updatedContext.stage);
      
      // Only show AI response, not the interruption
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: message.text, 
        stage: message.stage, 
        isAIGenerated: message.isAIGenerated 
      }]);
      
      speakText(message.text, () => {
        setIsLoading(false);
        if (message.isQuestion && updatedContext.stage !== InterviewStage.COMPLETE) {
          setTimeout(() => startListening(), 500);
        }
      });
      return;
    }
    
    setIsLoading(true);
    
    // Store message with the question that was asked
    setMessages(prev => [...prev, { 
      sender: 'user', 
      text: candidateMessage,
      question: currentQuestion 
    }]);
    
    // Generate feedback for this answer (only for real answers)
    if (currentQuestion && candidateMessage.length > 10 && !isInterruptionMessage(candidateMessage)) {
      generateFeedback(currentQuestion, candidateMessage, questionNumber);
    }
    
    try {
      if (candidateMessage.split(' ').length > 3) {
        const updatedMemory = storeAnswer(
          interviewContext.memory,
          interviewContext.stage,
          currentQuestion || '',
          candidateMessage
        );
        setInterviewContext(prev => prev ? { ...prev, memory: updatedMemory } : null);
      }
      
      const { message, updatedContext } = await getNextInterviewerMessage({
        context: interviewContext,
        candidateMessage,
      });
      
      setInterviewContext(updatedContext);
      setCurrentStage(updatedContext.stage);
      
      // Store the new question for next feedback
      if (message.isQuestion) {
        lastQuestionRef.current = message.text;
      }
      
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: message.text, 
        stage: message.stage, 
        isAIGenerated: message.isAIGenerated 
      }]);
      
      // Check if interview is complete
      if (updatedContext.stage === InterviewStage.COMPLETE) {
        generateSummary();
      }
      
      speakText(message.text, () => {
        setIsLoading(false);
        if (message.isQuestion && updatedContext.stage !== InterviewStage.COMPLETE) {
          setTimeout(() => startListening(), 500);
        }
      });
    } catch (err) {
      console.error('Error:', err);
      setIsLoading(false);
    }
  };

  // Track last processed message to prevent duplicates
  const lastProcessedMessageRef = useRef<string>('');
  
  // Start listening
  const startListening = useCallback(() => {
    console.log('[Speech] Starting listening...');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported. Use Chrome.');
      return;
    }
    
    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    let lastSpeechTime = Date.now();
    let hasSpeech = false;
    finalTranscriptRef.current = '';
    setLiveTranscript('');
    
    recognitionRef.current.onstart = () => {
      console.log('[Speech] Recognition started');
      setIsListening(true);
      lastSpeechTime = Date.now();
      hasSpeech = false;
    };
    
    recognitionRef.current.onresult = (event: any) => {
      lastSpeechTime = Date.now();
      hasSpeech = true;
      
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      const fullTranscript = finalTranscriptRef.current + interimTranscript;
      console.log('[Speech] Transcript:', fullTranscript);
      setLiveTranscript(fullTranscript);
    };
    
    recognitionRef.current.onerror = (event: any) => {
      console.error('[Speech] Error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
      }
    };
    
    recognitionRef.current.onend = () => {
      console.log('[Speech] Recognition ended. Final transcript:', finalTranscriptRef.current);
      setIsListening(false);
      
      if (finalTranscriptRef.current.trim()) {
        const text = finalTranscriptRef.current.trim();
        
        // Prevent duplicate processing
        if (text === lastProcessedMessageRef.current) {
          console.log('[Speech] Duplicate message detected, ignoring');
          return;
        }
        lastProcessedMessageRef.current = text;
        
        console.log('[Speech] Processing:', text);
        // Use ref to avoid circular dependency
        if (processCandidateMessageRef.current) {
          processCandidateMessageRef.current(text);
        } else {
          console.error('[Speech] processCandidateMessageRef is null!');
        }
      } else {
        console.log('[Speech] No transcript to process');
      }
    };
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('[Speech] Failed to start:', err);
    }
  }, []);

  // Keep ref in sync
  useEffect(() => {
    processCandidateMessageRef.current = processCandidateMessage;
  }, [interviewContext]);

  // Stop listening
  const stopListening = useCallback(() => {
    clearInterval(silenceTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
    setLiveTranscript('');
  }, []);

  // Test voice
  const testVoice = async () => {
    if (!selectedInterviewer) return;
    
    setError(null);
    const testText = `Hello, my name is ${selectedInterviewer.name}. I will be conducting your interview today.`;
    const voiceId = getVoiceId(selectedInterviewer.name);
    
    console.log('[Test Voice] Interviewer:', selectedInterviewer.name, 'Voice ID:', voiceId);
    
    setVoiceStatus('loading');
    await speakWithElevenLabs(testText, voiceId, () => {
      setVoiceStatus('idle');
    });
  };

  // Start interview
  const startInterview = useCallback(async () => {
    if (!config.jobRole || !config.company || !selectedInterviewer) return;
    setError(null);
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setError('Microphone access required.');
      return;
    }
    
    // Create interview context with selected interviewer
    const context = createInterviewContext(config.jobRole, config.company);
    context.interviewerName = selectedInterviewer.name;
    context.interviewerGender = selectedInterviewer.gender;
    
    console.log('[Start Interview] Interviewer:', context.interviewerName, 'Voice:', getVoiceId(context.interviewerName));
    
    setInterviewContext(context);
    setCurrentStage(context.stage);
    setShowConfig(false);
    
    window.speechSynthesis.getVoices();
    
    setTimeout(async () => {
      const { message } = await getNextInterviewerMessage({ context });
      setMessages([{ sender: 'ai', text: message.text, stage: message.stage, isAIGenerated: message.isAIGenerated }]);
      
      speakText(message.text, () => {
        startListening();
      });
    }, 500);
  }, [config, selectedInterviewer, speakText, startListening]);

  // Config Screen
  if (showConfig) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] p-6">
        <div className="max-w-xl mx-auto">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-6 text-[#2F2F2F] hover:bg-[#8B5A2B]/10">
            <ChevronLeft className="w-4 h-4 mr-2" />Back
          </Button>

          <div className="bg-white rounded-2xl shadow-sm border border-[#8B5A2B]/10 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-[#8B5A2B]/10 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-[#8B5A2B]" />
              </div>
              <h1 className="text-2xl font-semibold text-[#2F2F2F]">AI Interview</h1>
              <p className="text-[#2F2F2F]/60 mt-2">Practice with a professional Nigerian interviewer</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2F2F2F] mb-2">Job Role</label>
                <input type="text" value={config.jobRole} onChange={(e) => setConfig({ ...config, jobRole: e.target.value })} placeholder="e.g., Software Engineer" className="w-full px-4 py-3 rounded-xl border border-[#8B5A2B]/20 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2F2F2F] mb-2">Company</label>
                <input type="text" value={config.company} onChange={(e) => setConfig({ ...config, company: e.target.value })} placeholder="e.g., Paystack" className="w-full px-4 py-3 rounded-xl border border-[#8B5A2B]/20 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 outline-none" />
              </div>

              {selectedInterviewer && (
                <div className="bg-[#8B5A2B]/5 rounded-xl p-4 border border-[#8B5A2B]/10">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedInterviewer.gender === 'male' ? '👨‍💼' : '👩‍💼'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#2F2F2F]">Your interviewer: <span className="text-[#8B5A2B]">{selectedInterviewer.name}</span></p>
                      <p className="text-xs text-[#2F2F2F]/60">Nigerian {selectedInterviewer.gender} voice</p>
                    </div>
                    <button onClick={() => setSelectedInterviewer(pickRandomInterviewer())} className="text-xs px-3 py-1 bg-white rounded-lg border border-[#8B5A2B]/20 hover:bg-[#8B5A2B]/10">Change</button>
                  </div>
                </div>
              )}

              {selectedInterviewer && (
                <div className="pt-2">
                  <button onClick={testVoice} disabled={voiceStatus === 'loading'} className="w-full py-3 border-2 border-[#8B5A2B] text-[#8B5A2B] rounded-xl font-medium hover:bg-[#8B5A2B]/5 disabled:opacity-50 flex items-center justify-center gap-2">
                    {voiceStatus === 'loading' ? (<><div className="w-4 h-4 border-2 border-[#8B5A2B] border-t-transparent rounded-full animate-spin" />Loading...</>) : (<><Volume2 className="w-4 h-4" />Test Voice: "Hello, I am {selectedInterviewer.name}"</>)}
                  </button>
                </div>
              )}

              <Button onClick={startInterview} disabled={!config.jobRole || !config.company || !selectedInterviewer} className="w-full py-6 bg-[#8B5A2B] hover:bg-[#8B5A2B]/90 text-white rounded-xl font-medium disabled:opacity-50">
                Start Interview with {selectedInterviewer?.name || '...'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <div className="bg-white border-b border-[#8B5A2B]/10 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-[#2F2F2F] hover:bg-[#8B5A2B]/10">
              <ChevronLeft className="w-4 h-4 mr-2" />Exit
            </Button>
            {interviewContext && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8B5A2B]/10 flex items-center justify-center text-xl">{interviewContext.interviewerGender === 'male' ? '👨‍💼' : '👩‍💼'}</div>
                <div>
                  <div className="font-medium text-[#2F2F2F]">{interviewContext.interviewerName}</div>
                  <div className="text-xs text-[#2F2F2F]/60">Interviewer at {interviewContext.company}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[#2F2F2F]/60">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{formatTime(elapsedTime)}</span>
            </div>
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-lg hover:bg-[#8B5A2B]/10">
              {isMuted ? <VolumeX className="w-5 h-5 text-[#2F2F2F]" /> : <Volume2 className="w-5 h-5 text-[#8B5A2B]" />}
            </button>
            <Button variant="destructive" size="sm" onClick={() => router.push('/dashboard')}><PhoneOff className="w-4 h-4 mr-2" />End</Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video bg-[#2F2F2F] rounded-2xl relative overflow-hidden">
              <WaveformAnimation isActive={isAiSpeaking} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all duration-500 ${isAiSpeaking ? 'bg-[#8B5A2B] scale-110' : 'bg-[#8B5A2B]/20'}`}>
                    {interviewContext?.interviewerGender === 'male' ? '👨‍💼' : '👩‍💼'}
                  </div>
                  <p className="text-white/60 text-sm mt-4">{isAiSpeaking ? `${interviewContext?.interviewerName} is speaking...` : isListening ? 'Listening...' : 'Ready'}</p>
                </div>
              </div>
            </div>

            {liveTranscript && (
              <div className="bg-white rounded-xl p-4 border border-[#8B5A2B]/10">
                <div className="flex items-center gap-2 text-[#8B5A2B] text-sm mb-2"><Mic className="w-4 h-4" /><span>You</span></div>
                <p className="text-[#2F2F2F]">{liveTranscript}</p>
              </div>
            )}

            <button 
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  startListening();
                }
              }}
              disabled={isAiSpeaking || isLoading}
              className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${isListening ? 'bg-red-500 text-white' : isAiSpeaking || isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#8B5A2B] text-white hover:bg-[#8B5A2B]/90'}`}
            >
              <Mic className="w-5 h-5" />
              {isListening ? 'Listening... (click to stop)' : isAiSpeaking ? `${interviewContext?.interviewerName} speaking...` : 'Click to Talk'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#8B5A2B]/10 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-[#8B5A2B]/10 flex items-center justify-between">
              <h3 className="font-medium text-[#2F2F2F]">Conversation</h3>
              {currentStage && <span className="text-xs px-2 py-1 bg-[#8B5A2B]/10 text-[#8B5A2B] rounded-full">{currentStage}</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line ${msg.sender === 'ai' ? 'bg-[#8B5A2B]/10 text-[#2F2F2F] rounded-bl-md' : 'bg-[#8B5A2B] text-white rounded-br-md'}`}>
                    {msg.isAIGenerated && (
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">AI</span>
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#8B5A2B]/10 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-[#8B5A2B] animate-bounce" /><div className="w-2 h-2 rounded-full bg-[#8B5A2B] animate-bounce delay-75" /><div className="w-2 h-2 rounded-full bg-[#8B5A2B] animate-bounce delay-150" /></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#8B5A2B]/10 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {interviewContext && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{interviewContext.interviewerGender === 'male' ? '👨‍💼' : '👩‍💼'}</span>
                <div>
                  <div className="font-medium text-[#2F2F2F]">{interviewContext.interviewerName}</div>
                  <div className="text-xs text-[#2F2F2F]/60">Nigerian {interviewContext.interviewerGender} voice</div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {voiceStatus !== 'idle' && (
              <span className={`text-xs px-2 py-1 rounded-full ${voiceStatus === 'playing' ? 'bg-green-100 text-green-700' : voiceStatus === 'loading' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {voiceStatus === 'playing' ? '● Speaking' : voiceStatus === 'loading' ? '⟳ Loading...' : '✗ Error'}
              </span>
            )}
            {isListening && <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />Listening</span>}
          </div>
          <div className="text-sm text-[#2F2F2F]/60">{interviewContext && <span>Q{interviewContext.questionCount + 1}/{interviewContext.maxQuestions}</span>}</div>
        </div>
      </div>

      {/* Real-time Feedback Panel */}
      {showFeedback && currentFeedback && (
        <div className="fixed right-6 top-24 w-80 bg-white rounded-2xl shadow-xl border border-[#8B5A2B]/20 p-4 max-h-[70vh] overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#2F2F2F]">Answer Feedback</h3>
            <button onClick={() => setShowFeedback(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
              currentFeedback.score >= 8 ? 'bg-green-100 text-green-700' :
              currentFeedback.score >= 6 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {currentFeedback.score}
            </div>
            <div>
              <p className="font-medium text-[#2F2F2F]">{currentFeedback.rating}</p>
              <p className="text-xs text-gray-500">out of 10</p>
            </div>
          </div>

          <div className="space-y-3">
            {currentFeedback.strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-700 mb-1">✓ Strengths</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {currentFeedback.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </div>
            )}

            {currentFeedback.improvements.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-700 mb-1">⚡ Areas to Improve</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {currentFeedback.improvements.map((imp, i) => <li key={i}>• {imp}</li>)}
                </ul>
              </div>
            )}

            {currentFeedback.suggestedAnswer && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700 mb-1">💡 Suggested Answer</p>
                <p className="text-xs text-gray-600 italic">{currentFeedback.suggestedAnswer}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interview Summary Modal */}
      {showSummary && interviewSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#2F2F2F]">Interview Complete!</h2>
              <p className="text-gray-500">Here's your performance report</p>
            </div>

            <div className="flex justify-center mb-6">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                interviewSummary.overallScore >= 8 ? 'bg-green-100' :
                interviewSummary.overallScore >= 6 ? 'bg-amber-100' :
                'bg-red-100'
              }`}>
                <div className="text-center">
                  <p className={`text-3xl font-bold ${
                    interviewSummary.overallScore >= 8 ? 'text-green-700' :
                    interviewSummary.overallScore >= 6 ? 'text-amber-700' :
                    'text-red-700'
                  }`}>{interviewSummary.overallScore}</p>
                  <p className="text-xs text-gray-500">/10</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Overall Rating</p>
                <p className="font-semibold text-[#2F2F2F]">{interviewSummary.overallRating}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Hiring Recommendation</p>
                <p className="font-semibold text-[#2F2F2F]">{interviewSummary.hiringRecommendation}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {interviewSummary.keyStrengths.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-700 mb-2">Your Strengths</h4>
                  <ul className="space-y-1">
                    {interviewSummary.keyStrengths.map((s, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {interviewSummary.areasToImprove.length > 0 && (
                <div>
                  <h4 className="font-medium text-amber-700 mb-2">Areas to Develop</h4>
                  <ul className="space-y-1">
                    {interviewSummary.areasToImprove.map((a, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-amber-500">⚡</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {interviewSummary.performanceHighlights && (
                <div className="bg-[#8B5A2B]/5 rounded-xl p-4">
                  <h4 className="font-medium text-[#8B5A2B] mb-2">Highlights</h4>
                  <p className="text-sm text-gray-600">{interviewSummary.performanceHighlights}</p>
                </div>
              )}

              {interviewSummary.developmentPlan && (
                <div>
                  <h4 className="font-medium text-[#2F2F2F] mb-2">Development Plan</h4>
                  <p className="text-sm text-gray-600">{interviewSummary.developmentPlan}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setShowSummary(false)} className="flex-1 bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                Close Report
              </Button>
              <Button onClick={() => router.push('/dashboard')} variant="outline" className="flex-1">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
