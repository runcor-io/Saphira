'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mic, PhoneOff, ChevronLeft, Users, Crown, TrendingUp, 
  UserCircle, Code, Plane, GraduationCap, BookOpen, 
  Radio, Store, Briefcase, Volume2, VolumeX, AlertCircle,
  Settings, Sparkles, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NIGERIAN_VOICES } from '@/lib/voice';
import {
  UseCase,
  UseCaseConfig,
  PanelMember,
  SaphiraSession,
  SaphiraMessage,
  QuestionFeedback,
  SessionSummary,
  CulturalContext,
} from '@/lib/saphira/types';
import {
  getAllUseCases,
  getUseCaseConfig,
  getDefaultPanel,
  detectUseCase,
} from '@/lib/saphira/useCaseConfigs';
import {
  createSession,
  startSession,
  processResponse,
  generateSessionSummary,
  getCurrentPanelMember,
} from '@/lib/saphira/panelEngine';
import { analyzeResponse } from '@/lib/saphira/culturalDetector';
import { Country } from '@/lib/saphira/verifiedDataset';
import CompanySelector from '@/components/interview/CompanySelector';
import { generateCountryPanel } from '@/lib/saphira/panelInteraction';

// Icon mapping
const useCaseIcons: Record<string, React.ElementType> = {
  Briefcase,
  Plane,
  GraduationCap,
  TrendingUp,
  BookOpen,
  Users,
  Mic,
  Store,
  Radio,
};

// Waveform animation for panel members
function PanelWaveform({ isActive, color }: { isActive: boolean; color: string }) {
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

      for (let ring = 0; ring < 4; ring++) {
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i <= 360; i += 5) {
          const angle = (i * Math.PI) / 180;
          const wave = Math.sin(angle * 4 + time + ring * 0.5) * (isActive ? 15 : 3);
          const radius = 50 + ring * 20 + wave;
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
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = isActive ? 0.7 : 0.15;
        ctx.stroke();
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, color]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// Main component
export default function SaphiraInterviewPage() {
  const router = useRouter();
  
  // Configuration states
  const [step, setStep] = useState<'use-case' | 'configure' | 'company' | 'panel' | 'interview' | 'summary'>('use-case');
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase>('job_interview');
  const [topic, setTopic] = useState('');
  const [company, setCompany] = useState('');
  const [country, setCountry] = useState<Country>('nigeria');
  const [customPanel, setCustomPanel] = useState<PanelMember[]>([]);
  
  // Session states
  const [session, setSession] = useState<SaphiraSession | null>(null);
  const [messages, setMessages] = useState<SaphiraMessage[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<QuestionFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  
  // UI states
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [speakingMemberId, setSpeakingMemberId] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastProcessedMessageRef = useRef<string>('');
  const sessionRef = useRef<SaphiraSession | null>(null);
  
  // Keep session ref in sync
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const useCases = getAllUseCases();
  const config = selectedUseCase ? getUseCaseConfig(selectedUseCase) : null;

  // Browser TTS fallback
  const speakWithBrowserVoice = useCallback((text: string, onEnd?: () => void) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === 'en-US') || voices[0];
    if (voice) utterance.voice = voice;
    
    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => {
      setIsAiSpeaking(false);
      setSpeakingMemberId(null);
      onEnd?.();
    };
    utterance.onerror = () => {
      setIsAiSpeaking(false);
      setSpeakingMemberId(null);
      onEnd?.();
    };
    
    window.speechSynthesis.speak(utterance);
  }, []);

  // ElevenLabs voice synthesis
  const speakWithElevenLabs = useCallback(async (text: string, voiceId: string, memberId: string, onEnd?: () => void) => {
    if (isMuted) {
      onEnd?.();
      return;
    }
    
    setSpeakingMemberId(memberId);
    setIsAiSpeaking(true);
    
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      });
      
      if (!response.ok) throw new Error('Voice generation failed');
      
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onended = () => {
          setIsAiSpeaking(false);
          setSpeakingMemberId(null);
          URL.revokeObjectURL(url);
          onEnd?.();
        };
        audioRef.current.onerror = () => {
          setIsAiSpeaking(false);
          setSpeakingMemberId(null);
          speakWithBrowserVoice(text, onEnd);
        };
        await audioRef.current.play();
      }
    } catch (err) {
      speakWithBrowserVoice(text, onEnd);
    }
  }, [isMuted, speakWithBrowserVoice]);

  // Speak text with appropriate voice
  const speakText = useCallback(async (text: string, member?: PanelMember, onEnd?: () => void) => {
    if (!member) {
      speakWithBrowserVoice(text, onEnd);
      return;
    }
    
    const voiceId = member.voiceId || NIGERIAN_VOICES.male1;
    await speakWithElevenLabs(text, voiceId, member.id, onEnd);
  }, [speakWithBrowserVoice, speakWithElevenLabs]);

  // Track manual stop in a ref so callbacks can access it
  const isManuallyStoppedRef = useRef(false);
  
  // Handle candidate response with natural pacing
  const handleCandidateResponse = useCallback(async (text: string) => {
    if (!sessionRef.current) return;
    const currentSession = sessionRef.current;
    
    setIsLoading(true);
    
    // Add user message immediately for better UX
    const userMessage: SaphiraMessage = {
      id: `user_${Date.now()}`,
      sender: 'candidate',
      text: text,
      timestamp: new Date(),
      isQuestion: false,
    };
    
    const sessionWithUserMessage = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
    };
    
    setSession(sessionWithUserMessage);
    setMessages(sessionWithUserMessage.messages);
    
    try {
      const result = await processResponse(sessionWithUserMessage, text);
      
      setSession(result.updatedSession);
      setMessages(result.updatedSession.messages);
      
      if (result.feedback) {
        setCurrentFeedback(result.feedback);
        setShowFeedback(true);
      }
      
      if (result.isComplete) {
        const summary = generateSessionSummary(result.updatedSession);
        setSummary(summary);
        setStep('summary');
        setIsLoading(false);
        return;
      }
      
      // Get the panel member for the response
      const member = result.updatedSession.panel.find(
        m => m.id === result.responseMessage.panelMemberId
      );
      
      // === NATURAL PACING SEQUENCE ===
      // Step 1: Reaction (if exists) - "I see", "Alright"
      const speakReaction = async () => {
        if (result.reactionMessage && member) {
          await speakTextWithPromise(result.reactionMessage.text, member);
          // Wait reaction delay (thinking time)
          await delay(result.reactionDelay || 400);
        }
      };
      
      // Step 2: Panel Interaction (if exists) - panelist reacting to another
      const speakPanelInteraction = async () => {
        if (result.panelInteractionMessage && member) {
          await speakTextWithPromise(result.panelInteractionMessage.text, member);
          await delay(300);
        }
      };
      
      // Step 3: Main Response/Question with thinking delay
      const speakMainResponse = async () => {
        // Thinking delay before main response
        await delay(result.thinkingDelay || 800);
        await speakTextWithPromise(result.responseMessage.text, member);
      };
      
      // Execute sequence
      await speakReaction();
      await speakPanelInteraction();
      await speakMainResponse();
      
      setIsLoading(false);
      // Delay slightly then start listening to avoid state conflicts
      setTimeout(() => {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
          recognitionRef.current = null;
        }
        // Call startListening directly from ref to avoid circular dependency
        startListeningRef.current();
      }, 100);
      
    } catch (err) {
      console.error('Error processing response:', err);
      setError('Failed to process your response. Please try again.');
      setIsLoading(false);
    }
  }, []);
  
  // Ref to expose startListening to handleCandidateResponse
  const startListeningRef = useRef<() => void>(() => {});
  
  // Start listening - FIXED VERSION
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported. Please use Chrome or Edge.');
      return;
    }
    
    // Stop any existing recognition
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.stop(); 
        recognitionRef.current.onend = null; // Remove old handler
      } catch (e) {}
      recognitionRef.current = null;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    // CRITICAL: Reset ALL state
    isManuallyStoppedRef.current = false;
    submittedTextRef.current = null;
    finalTranscriptRef.current = '';
    setLiveTranscript('');
    
    recognition.onstart = () => {
      console.log('[Speech] Recognition started');
      setIsListening(true);
    };
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Accumulate final results
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
        console.log('[Speech] Final chunk:', finalTranscript);
      }
      
      // Show combined final + interim
      const displayText = finalTranscriptRef.current + interimTranscript;
      setLiveTranscript(displayText);
      console.log('[Speech] Display:', displayText);
    };
    
    recognition.onerror = (event: any) => {
      console.error('[Speech] Error:', event.error);
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        // No speech detected - restart if we're still supposed to be listening
        console.log('[Speech] No speech, will restart...');
        if (!isManuallyStoppedRef.current) {
          setTimeout(() => {
            if (!isManuallyStoppedRef.current) {
              try {
                recognition.start();
              } catch (e) {
                console.log('[Speech] Restart failed, user will need to click again');
              }
            }
          }, 100);
        }
      } else if (event.error === 'audio-capture') {
        setError('No microphone found. Please check your microphone connection.');
        setIsListening(false);
      } else if (event.error === 'network') {
        setError('Network error. Please check your internet connection.');
        setIsListening(false);
      } else if (event.error === 'aborted') {
        // User stopped it, no action needed
        console.log('[Speech] Aborted by user');
      } else {
        // Other errors - keep listening if possible
        console.log('[Speech] Other error:', event.error);
      }
    };
    
    recognition.onend = () => {
      // Check for submitted text first (handles race condition with manual submit)
      const textToProcess = submittedTextRef.current || finalTranscriptRef.current.trim();
      submittedTextRef.current = null; // Clear the submitted text ref
      
      console.log('[Speech] Recognition ended. Text:', textToProcess, 'Manually stopped:', isManuallyStoppedRef.current);
      
      // If manually stopped, process the text (but only if not already processed)
      if (isManuallyStoppedRef.current) {
        setIsListening(false);
        recognitionRef.current = null;
        
        // Only process if text exists and hasn't been processed yet
        if (textToProcess && textToProcess !== lastProcessedMessageRef.current) {
          console.log('[Speech] Processing from onend:', textToProcess);
          lastProcessedMessageRef.current = textToProcess;
          handleCandidateResponse(textToProcess);
        } else {
          console.log('[Speech] Text already processed or empty, skipping onend handler');
        }
      } else {
        // Auto-restart if not manually stopped (handles silence timeout)
        console.log('[Speech] Auto-restarting...');
        setTimeout(() => {
          if (!isManuallyStoppedRef.current && recognitionRef.current === recognition) {
            try {
              recognition.start();
              console.log('[Speech] Restarted successfully');
            } catch (e) {
              console.log('[Speech] Could not restart:', e);
              setIsListening(false);
            }
          }
        }, 100);
      }
    };
    
    // Start recognition
    try {
      recognition.start();
      console.log('[Speech] Start called');
    } catch (err) {
      console.error('[Speech] Failed to start:', err);
      setError('Failed to start microphone. Please try again.');
      setIsListening(false);
    }
  }, []);
  
  // Update ref so handleCandidateResponse can call the latest version
  startListeningRef.current = startListening;

  // Stop listening (manual)
  const stopListening = useCallback(() => {
    console.log('[Speech] Manually stopping');
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.stop(); 
        recognitionRef.current = null;
      } catch (e) {
        console.error('[Speech] Error stopping:', e);
      }
    }
    setIsListening(false);
  }, []);
  
  // Helper: Speak text and return promise
  const speakTextWithPromise = (text: string, member?: PanelMember): Promise<void> => {
    return new Promise((resolve) => {
      speakText(text, member, () => resolve());
    });
  };
  
  // Helper: Delay promise
  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // Track submitted text to prevent double-processing
  const submittedTextRef = useRef<string | null>(null);
  
  // Manual submit transcript
  const submitTranscript = useCallback(() => {
    const text = (finalTranscriptRef.current || liveTranscript).trim();
    console.log('[Speech] Manual submit:', text);
    
    if (text) {
      // Save text to prevent race condition with onend
      submittedTextRef.current = text;
      lastProcessedMessageRef.current = text;
      
      // Stop listening - this will trigger onend
      isManuallyStoppedRef.current = true;
      if (recognitionRef.current) {
        try { 
          recognitionRef.current.stop(); 
        } catch (e) {
          console.error('[Speech] Error stopping:', e);
        }
      }
      
      // Clear the display
      finalTranscriptRef.current = '';
      setLiveTranscript('');
      
      // Process the response (use saved text to avoid race condition)
      handleCandidateResponse(text);
    }
  }, [liveTranscript, handleCandidateResponse]);

  // Start the interview
  const startInterview = async () => {
    if (!selectedUseCase || !topic) return;
    
    const newSession = createSession(selectedUseCase, {
      topic,
      company: company || undefined,
      customPanel: customPanel.length > 0 ? customPanel : undefined,
      country,
    });
    
    setSession(newSession);
    
    const { messages: introMessages, updatedSession } = await startSession(newSession);
    setSession(updatedSession);
    setMessages(introMessages);
    setStep('interview');
    
    // Speak all introductions sequentially
    let currentMessageIndex = 0;
    
    const speakNextMessage = () => {
      if (currentMessageIndex >= introMessages.length) {
        startListening();
        return;
      }
      
      const message = introMessages[currentMessageIndex];
      const member = updatedSession.panel.find(m => m.id === message.panelMemberId);
      
      speakText(message.text, member, () => {
        currentMessageIndex++;
        // Small delay between panelists
        setTimeout(speakNextMessage, 500);
      });
    };
    
    speakNextMessage();
  };

  // Get personality color
  const getPersonalityColor = (personality: string): string => {
    const colors: Record<string, string> = {
      strict: '#8B5A2B',
      supportive: '#2E7D32',
      skeptical: '#1565C0',
      technical: '#6A1B9A',
      direct: '#C62828',
      analytical: '#00695C',
    };
    return colors[personality] || '#8B5A2B';
  };

  // Render use case selection
  if (step === 'use-case') {
    return (
      <div className="min-h-screen bg-linen p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-charcoal mb-2">Saphira AI</h1>
            <p className="text-gray-600">Pan-African Professional Communication Platform</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-lg">🇳🇬</span>
              <span className="text-lg">🇰🇪</span>
              <span className="text-lg">🇿🇦</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((useCase) => {
              const Icon = useCaseIcons[useCase.icon] || Briefcase;
              return (
                <button
                  key={useCase.id}
                  onClick={() => {
                    setSelectedUseCase(useCase.id);
                    if (useCase.id === 'job_interview') {
                      setStep('company');
                    } else {
                      setStep('configure');
                    }
                  }}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-wood/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-wood" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal">{useCase.displayName}</h3>
                      <p className="text-sm text-gray-500 mt-1">{useCase.description}</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                        <span>{useCase.expectedDuration} min</span>
                        <span>•</span>
                        <span>{useCase.defaultPanel.length} panelists</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Render company selection for job interviews
  if (step === 'company') {
    return (
      <div className="min-h-screen bg-linen p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => selectedUseCase === 'job_interview' ? setStep('company') : setStep('use-case')}
            className="flex items-center gap-2 text-gray-500 mb-6 hover:text-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
            {selectedUseCase === 'job_interview' ? 'Back to company selection' : 'Back to use cases'}
          </button>
          
          <CompanySelector
            country={country}
            selectedCompany={company || 'general'}
            onSelect={setCompany}
            onStart={() => setStep('configure')}
          />
        </div>
      </div>
    );
  }

  // Render configuration
  if (step === 'configure') {
    const defaultPanel = getDefaultPanel(selectedUseCase);
    const countryPanel = generateCountryPanel(country, defaultPanel.length);
    
    return (
      <div className="min-h-screen bg-linen p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => setStep('use-case')}
            className="flex items-center gap-2 text-gray-500 mb-6 hover:text-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to use cases
          </button>
          
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-wood/10 flex items-center justify-center">
                {(() => {
                  const Icon = useCaseIcons[config?.icon || 'Briefcase'];
                  return <Icon className="w-5 h-5 text-wood" />;
                })()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-charcoal">{config?.displayName}</h1>
                <p className="text-sm text-gray-500">{config?.description}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  {selectedUseCase === 'job_interview' ? 'Job Role' : 
                   selectedUseCase === 'business_pitch' ? 'Business/Idea Name' :
                   selectedUseCase === 'embassy_interview' ? 'Destination Country' :
                   selectedUseCase === 'scholarship_interview' ? 'Field of Study' :
                   'Topic'}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={
                    selectedUseCase === 'job_interview' ? 'e.g., Software Developer' :
                    selectedUseCase === 'business_pitch' ? 'e.g., RUNCOR Compute Network' :
                    'Enter topic...'
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-wood"
                />
              </div>
              
              {/* Country Selection */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Select Your Region</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'nigeria', name: 'Nigeria', flag: '🇳🇬' },
                    { id: 'kenya', name: 'Kenya', flag: '🇰🇪' },
                    { id: 'south_africa', name: 'South Africa', flag: '🇿🇦' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCountry(c.id as Country)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        country === c.id
                          ? 'border-wood bg-wood/5 text-wood'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl mb-1 block">{c.flag}</span>
                      <span className="text-xs font-medium">{c.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Select your region for culturally appropriate questions, accents, and panel styles
                </p>
              </div>

              {selectedUseCase === 'job_interview' && (
                <div className="p-4 bg-wood/5 rounded-xl border border-wood/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">Selected Company</label>
                      <p className="text-lg font-semibold text-wood">
                        {company && company !== 'general' 
                          ? company.replace(/_/g, ' ') 
                          : 'General Practice (All Companies)'}
                      </p>
                    </div>
                    <button
                      onClick={() => setStep('company')}
                      className="text-sm text-wood hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  {company && company !== 'general' && (
                    <p className="text-xs text-gray-500 mt-2">
                      You'll be asked real interview questions from this company
                    </p>
                  )}
                </div>
              )}
              
              <div className="pt-4">
                <h3 className="font-medium text-charcoal mb-3">Your Panel ({defaultPanel.length} members)</h3>
                <div className="space-y-2">
                  {defaultPanel.map((member, index) => {
                    const countryName = countryPanel[index]?.name || member.name;
                    const countryRole = countryPanel[index]?.role || member.role;
                    return (
                      <div key={member.id} className="flex items-center gap-3 p-3 bg-linen rounded-xl">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: getPersonalityColor(member.personality) }}
                        >
                          {countryName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-charcoal text-sm">{countryName}</p>
                          <p className="text-xs text-gray-500">{countryRole} • {member.personality}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              
              <Button
                onClick={startInterview}
                disabled={!topic || isLoading}
                className="w-full bg-wood hover:bg-wood-dark text-white rounded-full py-6 text-lg"
              >
                {isLoading ? 'Starting...' : 'Start Practice Session'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render interview
  if (step === 'interview' && session) {
    const currentMember = getCurrentPanelMember(session);
    
    return (
      <div className="min-h-screen bg-linen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-linen rounded-full">
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-wood rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-charcoal">{config?.displayName}</h1>
                  <p className="text-sm text-gray-500">{topic}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {session.panel.map((p) => (
                  <div 
                    key={p.id} 
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: getPersonalityColor(p.personality) }}
                  >
                    {p.name[0]}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-500">{session.panel.length} Panelists</span>
              <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-linen rounded-full">
                {isMuted ? <VolumeX className="w-5 h-5 text-gray-500" /> : <Volume2 className="w-5 h-5 text-gray-500" />}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          {/* Left - Panel Grid */}
          <div className="w-3/5 bg-gradient-to-br from-charcoal to-gray-900 p-6 relative">
            <div className="relative h-full grid gap-4"
              style={{
                gridTemplateColumns: session.panel.length <= 2 ? 'repeat(2, 1fr)' : 
                                    session.panel.length <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gridTemplateRows: session.panel.length <= 2 ? 'repeat(1, 1fr)' : 'repeat(2, 1fr)',
              }}
            >
              {session.panel.map((member) => {
                const isSpeaking = speakingMemberId === member.id;
                return (
                  <div 
                    key={member.id} 
                    className="relative rounded-2xl overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, ${getPersonalityColor(member.personality)}20 0%, ${getPersonalityColor(member.personality)}10 100%)`,
                      border: `1px solid ${getPersonalityColor(member.personality)}40`
                    }}
                  >
                    <div className="absolute inset-0">
                      <PanelWaveform isActive={isSpeaking} color={getPersonalityColor(member.personality)} />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <div 
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-transform ${isSpeaking ? 'scale-110' : 'scale-100'}`}
                        style={{ background: getPersonalityColor(member.personality) }}
                      >
                        <span className="text-white text-xl font-bold">{member.name[0]}</span>
                      </div>
                      <h3 className="text-white font-bold">{member.name}</h3>
                      <p className="text-white/60 text-xs text-center">{member.role}</p>
                      <p className="text-white/40 text-xs mt-1 capitalize">{member.personality}</p>
                      {isSpeaking && <div className="absolute top-3 right-3 w-3 h-3 rounded-full animate-pulse bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Presenter badge */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="bg-white/10 backdrop-blur rounded-full px-6 py-3 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <span className="text-charcoal font-bold">You</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Presenting</p>
                    <p className="text-white/60 text-sm">{topic}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* End Session */}
            <div className="absolute bottom-6 left-6">
              <button 
                onClick={() => {
                  stopListening();
                  if (audioRef.current) audioRef.current.pause();
                  const summary = generateSessionSummary(session);
                  setSummary(summary);
                  setStep('summary');
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors shadow-lg text-sm"
              >
                <PhoneOff className="w-4 h-4" />End Session
              </button>
            </div>
          </div>

          {/* Right - Chat */}
          <div className="w-2/5 bg-white flex flex-col">
            {/* Current speaker header */}
            <div 
              className="p-4 border-b border-gray-200"
              style={{ background: `linear-gradient(90deg, ${getPersonalityColor(currentMember?.personality || 'direct')}10 0%, transparent 100%)` }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: getPersonalityColor(currentMember?.personality || 'direct') }}
                >
                  {currentMember?.name[0] || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-charcoal">{currentMember?.name || 'Interviewer'}</h3>
                  <p className="text-sm text-gray-500">
                    {isAiSpeaking ? 'Speaking...' : isListening ? 'Listening to you...' : 'Waiting...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 bg-linen rounded-full text-xs text-gray-500">
                  {config?.displayName} Started
                </span>
              </div>
              
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'candidate';
                const member = msg.panelMemberId 
                  ? session.panel.find(p => p.id === msg.panelMemberId)
                  : null;
                
                return (
                  <div key={msg.id || index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-start gap-2 max-w-[90%]">
                      {!isUser && member && (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                          style={{ backgroundColor: getPersonalityColor(member.personality) }}
                        >
                          {member.name[0]}
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-2.5 ${isUser ? 'bg-wood text-white' : 'bg-linen text-charcoal'}`}>
                        {!isUser && member && (
                          <p className="text-xs font-medium mb-1" style={{ color: getPersonalityColor(member.personality) }}>
                            {member.name}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Live transcript */}
              {isListening && liveTranscript && (
                <div className="flex justify-end">
                  <div className="max-w-[90%] rounded-2xl px-4 py-2.5 bg-wood/80 text-white">
                    <p className="text-sm leading-relaxed">{liveTranscript}</p>
                    <div className="flex gap-1 mt-1">
                      <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-linen rounded-2xl px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-wood rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-wood rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-2 h-2 bg-wood rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={isListening ? stopListening : startListening}
                  className={`p-2.5 rounded-full transition-colors ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-linen text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <input
                    type="text"
                    value={liveTranscript}
                    readOnly
                    placeholder={isListening ? 'Listening...' : isAiSpeaking ? 'Panel is speaking...' : 'Push mic to speak...'}
                    className="w-full px-4 py-2.5 bg-linen rounded-full text-sm text-charcoal placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
                {isListening && (
                  <button
                    onClick={submitTranscript}
                    disabled={!liveTranscript}
                    className="px-4 py-2 bg-wood text-white rounded-full text-sm font-medium hover:bg-wood-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit
                  </button>
                )}
              </div>
              {isListening && liveTranscript && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Click Submit when done speaking, or pause to auto-submit
                </p>
              )}
            </div>
          </div>
        </main>

        {/* Feedback Panel */}
        {showFeedback && currentFeedback && (
          <div className="fixed right-6 top-24 w-80 bg-white rounded-2xl shadow-xl border border-[#8B5A2B]/20 p-4 max-h-[70vh] overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#2F2F2F]">Panel Feedback</h3>
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

              {currentFeedback.culturalNotes && (
                <div className="bg-wood/10 rounded-lg p-3">
                  <p className="text-xs font-medium text-wood mb-1">🌍 Cultural Context</p>
                  <p className="text-xs text-gray-600">{currentFeedback.culturalNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <audio ref={audioRef} className="hidden" />
      </div>
    );
  }

  // Render summary
  if (step === 'summary' && summary) {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-wood/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-wood" />
            </div>
            <h2 className="text-2xl font-bold text-[#2F2F2F]">Session Complete</h2>
            <p className="text-gray-600">Here&apos;s your performance summary</p>
          </div>
          
          <div className="flex items-center gap-4 mb-6 justify-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold ${
              summary.overallScore >= 8 ? 'bg-green-100 text-green-700' :
              summary.overallScore >= 6 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {summary.overallScore}
            </div>
            <div className="text-left">
              <p className="text-xl font-medium text-[#2F2F2F]">{summary.overallRating}</p>
              <p className="text-sm text-gray-500">{summary.questionsAnswered} questions answered</p>
              <p className="text-sm font-medium mt-1" style={{ 
                color: summary.recommendation.includes('Strongly') ? '#16a34a' :
                       summary.recommendation.includes('Recommend') ? '#8B5A2B' : '#dc2626'
              }}>
                {summary.recommendation}
              </p>
            </div>
          </div>

          {summary.keyStrengths.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-[#2F2F2F] mb-2">Key Strengths</h3>
              <ul className="space-y-1">
                {summary.keyStrengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-600">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.areasToImprove.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-[#2F2F2F] mb-2">Areas to Develop</h3>
              <ul className="space-y-1">
                {summary.areasToImprove.map((imp, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-amber-600">⚡</span> {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-wood/10 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-[#2F2F2F] mb-1">Cultural Adaptability</h3>
            <p className="text-sm text-gray-600">{summary.culturalAdaptability}</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => router.push('/dashboard')} className="flex-1 bg-wood hover:bg-wood-dark text-white">
              Back to Dashboard
            </Button>
            <Button onClick={() => {
              setStep('use-case');
              setSession(null);
              setMessages([]);
              setSummary(null);
            }} variant="outline" className="flex-1">
              New Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
