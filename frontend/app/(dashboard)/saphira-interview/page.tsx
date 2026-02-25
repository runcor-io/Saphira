'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mic, 
  MicOff, 
  Send, 
  Settings, 
  Play, 
  Square, 
  Volume2, 
  VolumeX,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Users,
  Building2,
  MapPin,
  ArrowLeft,
  Loader2,
  CheckCircle,
  BarChart3,
  Lightbulb,
  AlertCircle,
  Plus,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  createSession,
  startSession,
  processResponse,
  generateSessionSummary,
  type SaphiraSession,
  type SaphiraMessage,
  type SessionSummary,
  type QuestionFeedback,
  type PanelMember,
  type Country,
  type UseCase,
} from '@/lib/saphira';
import { getAllUseCases, getUseCaseConfig } from '@/lib/saphira';
import { determinePhase, determineSector } from '@/lib/saphira/immersiveEngine';
import { generateImmersiveResponse } from '@/lib/saphira/immersiveEngine';

// Animation component for voice visualization
const VoiceOrb = ({ isListening, isAiSpeaking, color = '#8b5cf6' }: { 
  isListening: boolean; 
  isAiSpeaking: boolean;
  color?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const isActive = isListening || isAiSpeaking;

    const animate = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, isAiSpeaking, color]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      className="w-48 h-48"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
};

export default function SaphiraInterviewPage() {
  const router = useRouter();
  
  // Session states
  const [step, setStep] = useState<'setup' | 'interview' | 'summary'>('setup');
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase>('job_interview');
  const [topic, setTopic] = useState('');
  const [company, setCompany] = useState('');
  const [country, setCountry] = useState<Country>('nigeria');
  const [customPanel, setCustomPanel] = useState<PanelMember[]>([]);
  const [newPanelistName, setNewPanelistName] = useState('');
  const [newPanelistRole, setNewPanelistRole] = useState('');
  
  // Interview states
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
  
  // Speech recognition state guards
  const isManuallyStoppedRef = useRef(false);
  const submittedTextRef = useRef<string | null>(null);
  const lastRestartTimeRef = useRef<number>(0);
  const isStartingRef = useRef(false);

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

    try {
      setIsAiSpeaking(true);
      setSpeakingMemberId(memberId);

      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) throw new Error('Voice synthesis failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsAiSpeaking(false);
          setSpeakingMemberId(null);
          URL.revokeObjectURL(audioUrl);
          onEnd?.();
        };
        audioRef.current.onerror = () => {
          setIsAiSpeaking(false);
          setSpeakingMemberId(null);
          URL.revokeObjectURL(audioUrl);
          onEnd?.();
        };
        await audioRef.current.play();
      }
    } catch (err) {
      console.error('ElevenLabs error:', err);
      // Fallback to browser voice on error
      speakWithBrowserVoice(text, onEnd);
    }
  }, [isMuted, speakWithBrowserVoice]);

  // Speak text with appropriate voice
  const speakText = useCallback((text: string, member?: PanelMember, onEnd?: () => void) => {
    if (isMuted) {
      onEnd?.();
      return;
    }

    if (member?.voiceId) {
      speakWithElevenLabs(text, member.voiceId, member.id, onEnd);
    } else {
      speakWithBrowserVoice(text, onEnd);
    }
  }, [isMuted, speakWithBrowserVoice, speakWithElevenLabs]);

  // Handle candidate response with IMMERSIVE panel dynamics
  const handleCandidateResponse = useCallback(async (text: string) => {
    if (!sessionRef.current) return;
    const currentSession = sessionRef.current;
    
    setIsLoading(true);
    
    // Add user message
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
      // Determine conversation context
      const phase = determinePhase(sessionWithUserMessage);
      const sector = determineSector(sessionWithUserMessage.topic, sessionWithUserMessage.company);
      
      // Use immersive engine for realistic panel dynamics
      const result = await generateImmersiveResponse(
        sessionWithUserMessage,
        text,
        {
          topic: sessionWithUserMessage.topic || 'general',
          sector,
          seniority: 'mid',
          tone: phase === 'opening' ? 'warm' : phase === 'pressure' ? 'challenging' : 'formal',
          currentPhase: phase,
        }
      );
      
      // Update session with all messages from the panel
      const updatedSession = {
        ...sessionWithUserMessage,
        messages: [...sessionWithUserMessage.messages, ...result.messages],
        questionCount: sessionWithUserMessage.questionCount + result.messages.filter(m => m.isQuestion).length,
      };
      
      setSession(updatedSession);
      setMessages(updatedSession.messages);
      
      if (result.isComplete) {
        const summary = generateSessionSummary(updatedSession);
        setSummary(summary);
        setStep('summary');
        setIsLoading(false);
        return;
      }
      
      // === IMMERSIVE PACING WITH ALL PANELISTS ===
      // Speak all messages sequentially with natural pacing
      for (let i = 0; i < result.messages.length; i++) {
        const message = result.messages[i];
        const member = updatedSession.panel.find(m => m.id === message.panelMemberId);
        
        if (member) {
          // Different pacing based on message type
          if (message.isSideRemark || message.isNonVerbal) {
            // Brief remarks - quick
            await speakTextWithPromise(message.text, member);
            await delay(200);
          } else if (message.isPanelInteraction) {
            // Panel interactions - natural pause
            await delay(400);
            await speakTextWithPromise(message.text, member);
            await delay(300);
          } else {
            // Main questions/responses - thinking time
            await delay(600 + Math.random() * 600); // 600-1200ms thinking time
            await speakTextWithPromise(message.text, member);
            
            // Longer pause after questions
            if (message.isQuestion) {
              await delay(500);
            }
          }
        }
      }
      
      setIsLoading(false);
      
      // Restart listening after all panelists have spoken
      // Ensure clean state before restarting
      setTimeout(() => {
        isManuallyStoppedRef.current = false; // Reset for auto-restart
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
          recognitionRef.current = null;
        }
        // Small delay to ensure previous recognition fully ended
        setTimeout(() => {
          startListeningRef.current();
        }, 100);
      }, 200);
      
    } catch (err) {
      console.error('Error processing response:', err);
      setError('Failed to process your response. Please try again.');
      setIsLoading(false);
    }
  }, []);
  
  // Ref to expose startListening to handleCandidateResponse
  const startListeningRef = useRef<() => void>(() => {});
  
  // Start listening - FIXED VERSION with safeguards
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported. Please use Chrome or Edge.');
      return;
    }
    
    // Prevent concurrent starts
    if (isStartingRef.current) {
      console.log('[Speech] Already starting, ignoring duplicate call');
      return;
    }
    
    // Debounce rapid restarts (minimum 100ms between restarts)
    const now = Date.now();
    if (now - lastRestartTimeRef.current < 100) {
      console.log('[Speech] Restart too rapid, debouncing...');
      return;
    }
    lastRestartTimeRef.current = now;
    isStartingRef.current = true;
    
    // Stop any existing recognition and clean up
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.onend = null; // Remove handler to prevent auto-restart
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop(); 
      } catch (e) {}
      recognitionRef.current = null;
    }
    
    // Small delay to ensure clean state
    setTimeout(() => {
      try {
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
            // No speech detected - don't auto-restart to avoid loops
            // Just log it - onend will fire and handle restart if needed
            console.log('[Speech] No speech detected, waiting for onend...');
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
          console.log('[Speech] Recognition ended. Manually stopped:', isManuallyStoppedRef.current);
          
          // If manually stopped, handle submission
          if (isManuallyStoppedRef.current) {
            setIsListening(false);
            recognitionRef.current = null;
            
            // Get text - either from manual submit ref or accumulated transcript
            const textToProcess = submittedTextRef.current || finalTranscriptRef.current.trim();
            submittedTextRef.current = null; // Clear the submitted text ref
            
            // Only process if text exists and hasn't been processed yet
            if (textToProcess && textToProcess !== lastProcessedMessageRef.current) {
              console.log('[Speech] Processing from onend:', textToProcess);
              lastProcessedMessageRef.current = textToProcess;
              handleCandidateResponse(textToProcess);
            } else {
              console.log('[Speech] Text already processed or empty, skipping onend handler');
            }
          } else {
            // Not manually stopped - auto-restart after silence timeout
            // Small delay to ensure clean restart
            console.log('[Speech] Auto-restarting after silence...');
            setTimeout(() => {
              if (!isManuallyStoppedRef.current) {
                try {
                  // Create fresh recognition instance for clean state
                  startListeningRef.current();
                } catch (e) {
                  console.log('[Speech] Auto-restart failed:', e);
                  setIsListening(false);
                }
              }
            }, 150);
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
        } finally {
          isStartingRef.current = false;
        }
      } catch (outerErr) {
        console.error('[Speech] Outer error:', outerErr);
        isStartingRef.current = false;
      }
    }, 50); // Small delay for clean state
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
      
      currentMessageIndex++;
      
      if (member && message.text) {
        speakText(message.text, member, speakNextMessage);
      } else {
        speakNextMessage();
      }
    };
    
    speakNextMessage();
  };

  // End interview
  const endInterview = () => {
    if (session) {
      const finalSummary = generateSessionSummary(session);
      setSummary(finalSummary);
      setStep('summary');
    }
    stopListening();
  };

  // Add custom panelist
  const addPanelist = () => {
    if (newPanelistName && newPanelistRole) {
      const newMember: PanelMember = {
        id: `custom_${Date.now()}`,
        name: newPanelistName,
        role: newPanelistRole,
        personality: 'supportive',
        voiceId: undefined,
      };
      setCustomPanel([...customPanel, newMember]);
      setNewPanelistName('');
      setNewPanelistRole('');
    }
  };

  // Remove custom panelist
  const removePanelist = (id: string) => {
    setCustomPanel(customPanel.filter(p => p.id !== id));
  };

  // Get country flag emoji
  const getCountryFlag = (c: Country) => {
    const flags: Record<Country, string> = {
      nigeria: '🇳🇬',
      kenya: '🇰🇪',
      south_africa: '🇿🇦',
    };
    return flags[c];
  };

  // Render setup step
  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950">
        {/* Header */}
        <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Saphira
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/dashboard')}
                className="text-white/60 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Start Your Interview Session
            </h1>
            <p className="text-white/60 text-lg">
              Configure your practice interview settings below
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Use Case Selection */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-violet-400" />
                    Interview Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {useCases.map((useCase) => (
                      <button
                        key={useCase.id}
                        onClick={() => setSelectedUseCase(useCase.id)}
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all duration-200",
                          selectedUseCase === useCase.id
                            ? "border-violet-500 bg-violet-500/20"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        )}
                      >
                        <div className="text-2xl mb-2">{useCase.icon}</div>
                        <div className="font-medium text-white text-sm">{useCase.displayName}</div>
                        <div className="text-xs text-white/50 mt-1">{useCase.description}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Topic & Details */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-violet-400" />
                    Session Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white/80">
                      Topic
                    </Label>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Enter topic..."
                      className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>

                  <div>
                    <Label className="text-white/80">
                      Company/Institution (Optional)
                    </Label>
                    <div className="relative mt-2">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <Input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g., Access Bank, Andela, Safaricom..."
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/80 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Country Context
                    </Label>
                    <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
                      <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        <SelectItem value="nigeria" className="text-white">
                          🇳🇬 Nigeria
                        </SelectItem>
                        <SelectItem value="kenya" className="text-white">
                          🇰🇪 Kenya
                        </SelectItem>
                        <SelectItem value="south_africa" className="text-white">
                          🇿🇦 South Africa
                        </SelectItem>

                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Panel */}
              {true && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-violet-400" />
                      Custom Panel Members
                    </CardTitle>
                    <CardDescription className="text-white/50">
                      Add specific panel members (optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newPanelistName}
                        onChange={(e) => setNewPanelistName(e.target.value)}
                        placeholder="Name"
                        className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                      <Input
                        value={newPanelistRole}
                        onChange={(e) => setNewPanelistRole(e.target.value)}
                        placeholder="Role"
                        className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                      <Button
                        onClick={addPanelist}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {customPanel.length > 0 && (
                      <div className="space-y-2">
                        {customPanel.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                          >
                            <div>
                              <div className="text-white font-medium">{member.name}</div>
                              <div className="text-white/50 text-sm">{member.role}</div>
                            </div>
                            <Button
                              onClick={() => removePanelist(member.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="bg-white/5 border-white/10 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Session Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Type</span>
                      <span className="text-white">{useCases.find(u => u.id === selectedUseCase)?.displayName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Topic</span>
                      <span className="text-white text-right truncate max-w-[120px]">
                        {topic || 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Company</span>
                      <span className="text-white">{company || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Country</span>
                      <span className="text-white">{getCountryFlag(country)}</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Panel Size</span>
                      <span className="text-white">{customPanel.length > 0 ? customPanel.length : 'Auto'}</span>
                    </div>
                  </div>

                  <Button
                    onClick={startInterview}
                    disabled={!topic}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render interview step
  if (step === 'interview' && session) {
    const currentSpeaker = session.panel.find(m => m.id === speakingMemberId);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950">
        {/* Header */}
        <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Saphira</span>
              <Badge variant="outline" className="border-violet-500/30 text-violet-300">
                {getCountryFlag(country)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "text-white/60 hover:text-white",
                  isMuted && "text-red-400 hover:text-red-300"
                )}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={endInterview}
                className="text-red-400 hover:text-red-300"
              >
                <Square className="w-4 h-4 mr-2" />
                End
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Interview Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Voice Visualization */}
              <Card className="bg-white/5 border-white/10 relative overflow-hidden">
                <CardContent className="p-8 flex flex-col items-center justify-center min-h-[320px]">
                  <VoiceOrb 
                    isListening={isListening} 
                    isAiSpeaking={isAiSpeaking}
                    color="#8b5cf6"
                  />
                  
                  {/* Status */}
                  <div className="mt-6 text-center">
                    {isAiSpeaking && currentSpeaker ? (
                      <div className="flex items-center gap-2 justify-center">
                        <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                          {currentSpeaker.name}
                        </Badge>
                        <span className="text-white/60">is speaking...</span>
                      </div>
                    ) : isListening ? (
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-white/60">Listening...</span>
                      </div>
                    ) : isLoading ? (
                      <div className="flex items-center gap-2 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                        <span className="text-white/60">Processing...</span>
                      </div>
                    ) : (
                      <span className="text-white/40">Ready</span>
                    )}
                  </div>

                  {/* Live Transcript */}
                  {liveTranscript && (
                    <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 max-w-md w-full">
                      <p className="text-white/80 text-center">{liveTranscript}</p>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                {!isListening ? (
                  <Button
                    onClick={startListening}
                    disabled={isAiSpeaking || isLoading}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-8"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Speaking
                  </Button>
                ) : (
                  <Button
                    onClick={stopListening}
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 px-8"
                  >
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                )}
                
                {(liveTranscript || finalTranscriptRef.current) && (
                  <Button
                    onClick={submitTranscript}
                    disabled={isLoading}
                    variant="outline"
                    className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                )}
              </div>

              {/* Messages */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Conversation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messages.map((message, index) => {
                      const member = session.panel.find(m => m.id === message.panelMemberId);
                      
                      if (message.sender === 'candidate') {
                        return (
                          <div key={message.id} className="flex justify-end">
                            <div className="max-w-[80%] p-4 rounded-2xl rounded-br-md bg-violet-600/20 border border-violet-500/30">
                              <p className="text-white">{message.text}</p>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={message.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-violet-300">
                              {member?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-violet-300">
                                {member?.name || 'Panel'}
                              </span>
                              <span className="text-xs text-white/40">{member?.role}</span>
                            </div>
                            <div className={cn(
                              "p-3 rounded-xl border",
                              message.isSideRemark || message.isNonVerbal
                                ? "bg-white/5 border-white/5 italic"
                                : "bg-white/5 border-white/10"
                            )}>
                              <p className={cn(
                                "text-white/90",
                                (message.isSideRemark || message.isNonVerbal) && "text-white/60"
                              )}>
                                {message.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Panel Info */}
            <div className="space-y-6">
              <Card className="bg-white/5 border-white/10 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-400" />
                    Panel Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {session.panel.map((member) => (
                      <div
                        key={member.id}
                        className={cn(
                          "p-3 rounded-lg border transition-all",
                          speakingMemberId === member.id
                            ? "border-violet-500/50 bg-violet-500/10"
                            : "border-white/10 bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#8b5cf620' }}
                          >
                            <span 
                              className="text-sm font-medium"
                              style={{ color: '#8b5cf6' }}
                            >
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate">{member.name}</div>
                            <div className="text-white/50 text-sm truncate">{member.role}</div>
                          </div>
                          {speakingMemberId === member.id && (
                            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Hidden audio element for ElevenLabs */}
        <audio ref={audioRef} className="hidden" />
      </div>
    );
  }

  // Render summary step
  if (step === 'summary' && summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950">
        {/* Header */}
        <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Saphira</span>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard')}
              className="text-white/60 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Interview Complete!
            </h1>
            <p className="text-white/60 text-lg">
              Here's how you performed
            </p>
          </div>

          <div className="space-y-6">
            {/* Overall Score */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white mb-2">
                      {summary.overallScore}%
                    </div>
                    <div className="text-white/60">Overall Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {summary.keyStrengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2 text-white/80">
                        <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {summary.areasToImprove.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-2 text-white/80">
                        <ChevronRight className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Key Insights */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-400" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {summary.panelFeedback && Object.values(summary.panelFeedback).map((feedback, index) => (
                    <li key={index} className="flex items-start gap-2 text-white/80">
                      <ChevronRight className="w-4 h-4 text-violet-400 mt-1 flex-shrink-0" />
                      {feedback}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-6">
              <Button
                onClick={() => {
                  setStep('setup');
                  setSession(null);
                  setMessages([]);
                  setSummary(null);
                  setTopic('');
                  setCompany('');
                }}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Start New Interview
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
