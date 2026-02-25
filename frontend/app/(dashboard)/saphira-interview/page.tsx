'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mic, PhoneOff, MessageSquare, ChevronLeft, Users, Crown, TrendingUp, 
  UserCircle, Zap, Settings, BarChart3, Briefcase, Plane, GraduationCap,
  BookOpen, Radio, Play, Plus, Trash2, User, ArrowLeft, Volume2, VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createSession,
  startSession,
  processResponse,
  generateSessionSummary,
  type SaphiraSession,
  type SaphiraMessage,
  type SessionSummary,
  type PanelMember,
  type Country,
  type UseCase,
} from '@/lib/saphira';
import { getAllUseCases, getUseCaseConfig } from '@/lib/saphira';
import { determinePhase, determineSector } from '@/lib/saphira/immersiveEngine';
import { generateImmersiveResponse } from '@/lib/saphira/immersiveEngine';

// Interview types for selection
const interviewTypes = [
  { id: 'job_interview', icon: Briefcase, title: 'Job Interview', desc: 'Practice job interviews with HR, technical, and leadership questions' },
  { id: 'embassy_interview', icon: Plane, title: 'Embassy/Visa Interview', desc: 'Practice visa interviews for study, work, or travel abroad' },
  { id: 'scholarship_interview', icon: GraduationCap, title: 'Scholarship Interview', desc: 'Practice academic scholarship and PhD admission interviews' },
  { id: 'business_pitch', icon: TrendingUp, title: 'Business Pitch', desc: 'Practice pitching to investors and securing funding' },
  { id: 'academic_presentation', icon: BookOpen, title: 'Academic Presentation', desc: 'Practice thesis defense and academic presentations' },
  { id: 'board_presentation', icon: Users, title: 'Board Presentation', desc: 'Practice executive presentations to senior leadership' },
  { id: 'conference', icon: Mic, title: 'Conference Presentation', desc: 'Practice presenting at professional conferences' },
  { id: 'media', icon: Radio, title: 'Media Interview', desc: 'Practice handling press and media questions' },
];

const roleOptions = ['CEO', 'CFO', 'CTO', 'HR Director', 'COO', 'VP Engineering', 'Product Manager', 'Team Lead', 'Other'];

// Default persona colors
const personaColors = [
  { color: '#8B5A2B', secondaryColor: '#D2B48C', icon: Crown },
  { color: '#2E7D32', secondaryColor: '#81C784', icon: TrendingUp },
  { color: '#1565C0', secondaryColor: '#64B5F6', icon: UserCircle },
  { color: '#6A1B9A', secondaryColor: '#BA68C8', icon: Zap },
];

interface CustomPanelist {
  id: string;
  name: string;
  gender: 'male' | 'female';
  demeanor: number;
  tone: number;
  attitude: number;
  role: string;
}

interface Persona {
  id: string;
  name: string;
  role: string;
  shortRole: string;
  color: string;
  secondaryColor: string;
  icon: React.ElementType;
  speaking: boolean;
}

// Waveform animation component
function PersonaWaveform({ isActive, color, secondaryColor }: { isActive: boolean; color: string; secondaryColor: string }) {
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
      timeRef.current += isActive ? 0.05 : 0.02;
      const time = timeRef.current;
      ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
      const centerX = canvas.offsetWidth / 2;
      const centerY = canvas.offsetHeight / 2;

      for (let ring = 0; ring < 5; ring++) {
        const ringOffset = ring * 0.6;
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i <= 360; i += 5) {
          const angle = (i * Math.PI) / 180;
          const intensity = isActive ? 1.5 : 0.5;
          const wave1 = Math.sin(angle * 3 + time + ringOffset) * (15 * intensity);
          const wave2 = Math.sin(angle * 5 + time * 1.3 + ringOffset) * (10 * intensity);
          const wave3 = Math.cos(angle * 2 + time * 0.8 + ringOffset) * (8 * intensity);
          const baseRadius = 45 + ring * 18;
          const radius = baseRadius + wave1 + wave2 + wave3;
          points.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
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

        const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 120);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, secondaryColor);
        gradient.addColorStop(1, color + '60');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.globalAlpha = isActive ? 0.8 + Math.sin(time * 2 + ring) * 0.2 : 0.2;
        ctx.stroke();
        ctx.fillStyle = gradient;
        ctx.globalAlpha = isActive ? 0.1 + Math.sin(time * 3 + ring) * 0.05 : 0.03;
        ctx.fill();
      }

      if (isActive) {
        const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 80);
        glowGradient.addColorStop(0, color + '66');
        glowGradient.addColorStop(0.5, secondaryColor + '33');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.globalAlpha = 0.7 + Math.sin(time * 5) * 0.2;
        ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, color, secondaryColor]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ filter: isActive ? `drop-shadow(0 0 30px ${color}99)` : 'none', transition: 'filter 0.3s ease' }}
    />
  );
}

// Speaking sound bars
function SpeakingBars({ isSpeaking, color }: { isSpeaking: boolean; color: string }) {
  if (!isSpeaking) return null;
  return (
    <div className="flex items-end gap-1 h-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full"
          style={{
            backgroundColor: color,
            height: '100%',
            animation: `soundBar 0.4s ease-in-out ${i * 0.08}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

export default function SaphiraInterviewPage() {
  const router = useRouter();
  const [step, setStep] = useState<'setup' | 'interview' | 'summary'>('setup');
  
  // Setup states
  const [selectedType, setSelectedType] = useState<UseCase>('job_interview');
  const [panelMode, setPanelMode] = useState<'default' | 'custom'>('default');
  const [customPanelists, setCustomPanelists] = useState<CustomPanelist[]>([]);
  const [topic, setTopic] = useState('');
  const [company, setCompany] = useState('');
  const [country, setCountry] = useState<Country>('nigeria');
  
  // Interview states
  const [session, setSession] = useState<SaphiraSession | null>(null);
  const [messages, setMessages] = useState<SaphiraMessage[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastProcessedMessageRef = useRef<string>('');
  const sessionRef = useRef<SaphiraSession | null>(null);
  const isManuallyStoppedRef = useRef(false);
  const submittedTextRef = useRef<string | null>(null);
  const lastRestartTimeRef = useRef<number>(0);
  const isStartingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addCustomPanelist = () => {
    const newPanelist: CustomPanelist = {
      id: Date.now().toString(),
      name: '',
      gender: 'male',
      demeanor: 50,
      tone: 50,
      attitude: 50,
      role: 'CEO',
    };
    setCustomPanelists([...customPanelists, newPanelist]);
  };

  const updatePanelist = (id: string, field: keyof CustomPanelist, value: string | number) => {
    setCustomPanelists(customPanelists.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePanelist = (id: string) => {
    setCustomPanelists(customPanelists.filter(p => p.id !== id));
  };

  const selectedTypeData = interviewTypes.find(t => t.id === selectedType);

  // Convert session panel to personas
  useEffect(() => {
    if (session?.panel) {
      const newPersonas = session.panel.map((member, index) => {
        const colors = personaColors[index % personaColors.length];
        return {
          id: member.id,
          name: member.name,
          role: member.role,
          shortRole: member.role.split(' ')[0],
          color: colors.color,
          secondaryColor: colors.secondaryColor,
          icon: colors.icon,
          speaking: false,
        };
      });
      setPersonas(newPersonas);
      if (newPersonas.length > 0) setSelectedPersona(newPersonas[0]);
    }
  }, [session?.panel]);

  // Browser TTS
  const speakWithBrowserVoice = useCallback((text: string, onEnd?: () => void) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === 'en-US') || voices[0];
    if (voice) utterance.voice = voice;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  }, []);

  // ElevenLabs TTS
  const speakWithElevenLabs = useCallback(async (text: string, voiceId: string, onEnd?: () => void) => {
    if (isMuted) { onEnd?.(); return; }
    try {
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
        audioRef.current.onended = () => { URL.revokeObjectURL(audioUrl); onEnd?.(); };
        audioRef.current.onerror = () => { URL.revokeObjectURL(audioUrl); onEnd?.(); };
        await audioRef.current.play();
      }
    } catch {
      speakWithBrowserVoice(text, onEnd);
    }
  }, [isMuted, speakWithBrowserVoice]);

  // Speak text
  const speakText = useCallback(async (text: string, member?: PanelMember, onEnd?: () => void) => {
    if (isMuted) { onEnd?.(); return; }
    if (member?.voiceId) {
      await speakWithElevenLabs(text, member.voiceId, onEnd);
    } else {
      speakWithBrowserVoice(text, onEnd);
    }
  }, [isMuted, speakWithBrowserVoice, speakWithElevenLabs]);

  const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  // Handle AI response
  const handleCandidateResponse = useCallback(async (text: string) => {
    if (!sessionRef.current) return;
    const currentSession = sessionRef.current;
    setIsLoading(true);

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
      const phase = determinePhase(sessionWithUserMessage);
      const sector = determineSector(sessionWithUserMessage.topic || 'general', sessionWithUserMessage.company);
      
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

      const updatedSession = {
        ...sessionWithUserMessage,
        messages: [...sessionWithUserMessage.messages, ...result.messages],
        questionCount: sessionWithUserMessage.questionCount + result.messages.filter(m => m.isQuestion).length,
      };
      setSession(updatedSession);
      setMessages(updatedSession.messages);

      if (result.isComplete) {
        const finalSummary = generateSessionSummary(updatedSession);
        setSummary(finalSummary);
        setStep('summary');
        setIsLoading(false);
        return;
      }

      // Speak messages sequentially
      for (const message of result.messages) {
        const member = updatedSession.panel.find(m => m.id === message.panelMemberId);
        const persona = personas.find(p => p.id === message.panelMemberId);
        
        if (persona && member) {
          setPersonas(prev => prev.map(p => ({ ...p, speaking: p.id === persona.id })));
          await delay(message.isSideRemark ? 200 : message.isPanelInteraction ? 400 : 600);
          await new Promise<void>(resolve => speakText(message.text, member, resolve));
          setPersonas(prev => prev.map(p => ({ ...p, speaking: false })));
          await delay(message.isQuestion ? 500 : 300);
        }
      }

      setIsLoading(false);
      setTimeout(() => startListening(), 200);
    } catch (err) {
      console.error('Error:', err);
      setIsLoading(false);
    }
  }, [personas, speakText]);

  // Speech recognition
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    if (isStartingRef.current) return;
    
    const now = Date.now();
    if (now - lastRestartTimeRef.current < 100) return;
    lastRestartTimeRef.current = now;
    isStartingRef.current = true;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    setTimeout(() => {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        isManuallyStoppedRef.current = false;
        submittedTextRef.current = null;
        finalTranscriptRef.current = '';
        setLiveTranscript('');
        
        recognition.onstart = () => setIsListening(true);
        
        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) final += t;
            else interim += t;
          }
          if (final) finalTranscriptRef.current += final;
          setLiveTranscript(finalTranscriptRef.current + interim);
        };
        
        recognition.onerror = () => {};
        
        recognition.onend = () => {
          const textToProcess = submittedTextRef.current || finalTranscriptRef.current.trim();
          submittedTextRef.current = null;
          
          if (isManuallyStoppedRef.current) {
            setIsListening(false);
            recognitionRef.current = null;
            if (textToProcess && textToProcess !== lastProcessedMessageRef.current) {
              lastProcessedMessageRef.current = textToProcess;
              handleCandidateResponse(textToProcess);
            }
          } else {
            setTimeout(() => startListening(), 150);
          }
        };
        
        recognition.start();
      } catch {}
      isStartingRef.current = false;
    }, 50);
  }, [handleCandidateResponse]);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const submitTranscript = useCallback(() => {
    const text = (finalTranscriptRef.current || liveTranscript).trim();
    if (text) {
      submittedTextRef.current = text;
      lastProcessedMessageRef.current = text;
      isManuallyStoppedRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      finalTranscriptRef.current = '';
      setLiveTranscript('');
      handleCandidateResponse(text);
    }
  }, [liveTranscript, handleCandidateResponse]);

  // Start interview
  const startInterview = async () => {
    const customPanel: PanelMember[] | undefined = panelMode === 'custom' && customPanelists.length > 0
      ? customPanelists.map((cp, idx) => ({
          id: `custom_${cp.id}`,
          name: cp.name || `Panelist ${idx + 1}`,
          role: cp.role,
          personality: (cp.demeanor < 30 ? 'direct' : cp.demeanor > 70 ? 'supportive' : 'analytical') as PanelMember['personality'],
          voiceId: cp.gender === 'male' ? 'U7wWSnxIJwCjioxt86mk' : 'Y4Xi1YBz9HedbrvzwylK',
          focus: 'general',
          gender: cp.gender,
        }))
      : undefined;

    const newSession = createSession(selectedType, {
      topic: topic || undefined,
      company: company || undefined,
      customPanel,
      country,
    });

    setSession(newSession);
    const { messages: introMessages, updatedSession } = await startSession(newSession);
    setSession(updatedSession);
    setMessages(updatedSession.messages);
    setStep('interview');

    // Speak introductions
    let msgIndex = 0;
    const speakNext = () => {
      if (msgIndex >= introMessages.length) {
        startListening();
        return;
      }
      const msg = introMessages[msgIndex];
      const member = updatedSession.panel.find(m => m.id === msg.panelMemberId);
      const persona = newSession.panel.find(p => p.id === msg.panelMemberId);
      if (member && persona) {
        setPersonas(prev => prev.map(p => ({ ...p, speaking: p.id === persona.id })));
        speakText(msg.text, member, () => {
          setPersonas(prev => prev.map(p => ({ ...p, speaking: false })));
          msgIndex++;
          speakNext();
        });
      } else {
        msgIndex++;
        speakNext();
      }
    };
    speakNext();
  };

  const endInterview = () => {
    if (session) {
      const finalSummary = generateSessionSummary(session);
      setSummary(finalSummary);
      setStep('summary');
    }
    stopListening();
  };

  const handleSend = () => {
    if (!currentInput.trim()) return;
    handleCandidateResponse(currentInput);
    setCurrentInput('');
  };

  // Get persona by ID helper
  const getPersonaById = (id: string) => personas.find(p => p.id === id);

  // Render SETUP step
  if (step === 'setup') {
    return (
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
          <header className="h-16 border-b border-white/10 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-white/60" />
              </button>
              <div>
                <h1 className="text-white font-semibold">Start Your Interview Session</h1>
                <p className="text-white/50 text-sm">Configure your practice interview settings below</p>
              </div>
            </div>
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-7xl mx-auto">
              <div className="flex gap-6">
                {/* Left Column */}
                <div className="flex-1 space-y-6">
                  {/* Interview Type */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#8B5A2B]" /> Interview Type
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {interviewTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selectedType === type.id;
                        return (
                          <button key={type.id} onClick={() => setSelectedType(type.id as UseCase)}
                            className={`p-4 rounded-xl text-left transition-all ${isSelected ? 'bg-[#8B5A2B]/30 border border-[#8B5A2B]/50' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                            <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-[#8B5A2B]' : 'text-white/60'}`} />
                            <p className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-white/80'}`}>{type.title}</p>
                            <p className="text-white/40 text-xs mt-1 line-clamp-2">{type.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-[#8B5A2B]" /> Session Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-white/60 text-sm mb-2 block">Topic</label>
                        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter topic..."
                          className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50" />
                      </div>
                      <div>
                        <label className="text-white/60 text-sm mb-2 block">Company/Institution (Optional)</label>
                        <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Access Bank, Shell..."
                          className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50" />
                      </div>
                      <div>
                        <label className="text-white/60 text-sm mb-2 block">Country Context</label>
                        <select value={country} onChange={(e) => setCountry(e.target.value as Country)}
                          className="w-full px-4 py-3 bg-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50 appearance-none cursor-pointer">
                          <option value="nigeria" className="bg-[#1a1a1f]">🇳🇬 Nigeria</option>
                          <option value="kenya" className="bg-[#1a1a1f]">🇰🇪 Kenya</option>
                          <option value="south_africa" className="bg-[#1a1a1f]">🇿🇦 South Africa</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Panel Setup */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#8B5A2B]" /> Panel Setup
                    </h3>
                    <div className="flex gap-3 mb-6">
                      <button onClick={() => setPanelMode('default')}
                        className={`flex-1 p-4 rounded-xl border transition-all ${panelMode === 'default' ? 'bg-[#8B5A2B]/20 border-[#8B5A2B]/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${panelMode === 'default' ? 'border-[#8B5A2B]' : 'border-white/30'}`}>
                            {panelMode === 'default' && <div className="w-2.5 h-2.5 rounded-full bg-[#8B5A2B]" />}
                          </div>
                          <span className="text-white font-medium">Use Default Panel</span>
                        </div>
                        <p className="text-white/50 text-sm pl-8">Uses preset panelists</p>
                      </button>
                      <button onClick={() => setPanelMode('custom')}
                        className={`flex-1 p-4 rounded-xl border transition-all ${panelMode === 'custom' ? 'bg-[#8B5A2B]/20 border-[#8B5A2B]/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${panelMode === 'custom' ? 'border-[#8B5A2B]' : 'border-white/30'}`}>
                            {panelMode === 'custom' && <div className="w-2.5 h-2.5 rounded-full bg-[#8B5A2B]" />}
                          </div>
                          <span className="text-white font-medium">Customize Your Panel</span>
                        </div>
                        <p className="text-white/50 text-sm pl-8">Create your own panelists</p>
                      </button>
                    </div>

                    {panelMode === 'custom' && (
                      <div className="space-y-4">
                        {customPanelists.length === 0 && (
                          <div className="text-center py-8 bg-white/5 rounded-xl">
                            <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                            <p className="text-white/50 text-sm">No custom panelists yet</p>
                          </div>
                        )}
                        {customPanelists.map((panelist, index) => (
                          <div key={panelist.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-[#8B5A2B]/30 rounded-lg flex items-center justify-center">
                                  <User className="w-4 h-4 text-[#8B5A2B]" />
                                </div>
                                <span className="text-white font-medium">Panelist {index + 1}</span>
                              </div>
                              <button onClick={() => removePanelist(panelist.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="text-white/50 text-xs mb-1 block">Name</label>
                                <input type="text" value={panelist.name} onChange={(e) => updatePanelist(panelist.id, 'name', e.target.value)} placeholder="e.g., Chief Okafor"
                                  className="w-full px-3 py-2 bg-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50" />
                              </div>
                              <div>
                                <label className="text-white/50 text-xs mb-1 block">Role</label>
                                <select value={panelist.role} onChange={(e) => updatePanelist(panelist.id, 'role', e.target.value)}
                                  className="w-full px-3 py-2 bg-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50 appearance-none cursor-pointer">
                                  {roleOptions.map(role => <option key={role} value={role} className="bg-[#1a1a1f]">{role}</option>)}
                                </select>
                              </div>
                            </div>
                            <div className="mb-4">
                              <label className="text-white/50 text-xs mb-2 block">Gender</label>
                              <div className="flex gap-2">
                                <button onClick={() => updatePanelist(panelist.id, 'gender', 'male')}
                                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${panelist.gender === 'male' ? 'bg-[#8B5A2B] text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>Male</button>
                                <button onClick={() => updatePanelist(panelist.id, 'gender', 'female')}
                                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${panelist.gender === 'female' ? 'bg-[#8B5A2B] text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>Female</button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {[
                                { label: 'Demeanor', field: 'demeanor' as const, left: 'Aggressive', right: 'Soft' },
                                { label: 'Tone', field: 'tone' as const, left: 'Serious', right: 'Calm' },
                                { label: 'Attitude', field: 'attitude' as const, left: 'Against', right: 'Supportive' },
                              ].map((slider) => (
                                <div key={slider.field}>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-white/50">{slider.label}</span>
                                  </div>
                                  <input type="range" min="0" max="100" value={panelist[slider.field]} onChange={(e) => updatePanelist(panelist.id, slider.field, parseInt(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#8B5A2B]" />
                                  <div className="flex justify-between text-xs mt-1">
                                    <span className="text-white/30">{slider.left}</span>
                                    <span className="text-white/30">{slider.right}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button onClick={addCustomPanelist} className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:text-white hover:border-white/40 transition-all flex items-center justify-center gap-2">
                          <Plus className="w-5 h-5" /> Add Panelist
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Preview */}
                <div className="w-80">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sticky top-6">
                    <h3 className="text-white font-semibold mb-4">Session Preview</h3>
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between text-sm"><span className="text-white/50">Type</span><span className="text-white">{selectedTypeData?.title}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-white/50">Topic</span><span className="text-white">{topic || 'Not set'}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-white/50">Company</span><span className="text-white">{company || 'Not set'}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-white/50">Country</span><span className="text-white">{country}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-white/50">Panel Size</span><span className="text-white">{panelMode === 'default' ? '4' : customPanelists.length}</span></div>
                    </div>
                    <button onClick={startInterview} disabled={!topic}
                      className="w-full py-3 bg-gradient-to-r from-[#8B5A2B] to-[#D2B48C] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#8B5A2B]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      <Play className="w-5 h-5" /> Start Session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </main>
  );
  }

  // Render INTERVIEW step
  if (step === 'interview' && session) {
    return (
      <main className="flex-1 flex flex-col relative z-10">
          {/* Header */}
          <header className="h-16 border-b border-white/10 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('setup')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-white/60" />
              </button>
              <div>
                <h1 className="text-white font-semibold">{session.useCase === 'board_presentation' ? 'Executive Panel' : 'Interview Panel'}</h1>
                <p className="text-white/50 text-sm">{topic || 'Practice Session'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10 text-white/60'}`}>
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div className="flex -space-x-2">
                {personas.map((p) => (
                  <div key={p.id} className="w-8 h-8 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: p.color }}>
                    {p.name[0]}
                  </div>
                ))}
              </div>
              <span className="text-white/50 text-sm">{personas.length} Panelists</span>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left - Main Stage */}
            <div className="flex-1 p-6 flex flex-col">
              {/* Personas Grid */}
              <div className="flex-1 grid grid-cols-2 gap-4 mb-6">
                {personas.map((persona) => {
                  const Icon = persona.icon;
                  const isSelected = selectedPersona?.id === persona.id;
                  return (
                    <div key={persona.id} onClick={() => setSelectedPersona(persona)}
                      className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group ${isSelected ? 'ring-2 ring-white/30' : ''}`}
                      style={{ background: `linear-gradient(135deg, ${persona.color}15 0%, ${persona.secondaryColor}08 100%)`, border: `1px solid ${persona.color}30` }}>
                      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
                      <div className="absolute inset-0">
                        <PersonaWaveform isActive={persona.speaking} color={persona.color} secondaryColor={persona.secondaryColor} />
                      </div>
                      <div className="relative h-full flex flex-col items-center justify-center p-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${persona.speaking ? 'scale-110' : 'group-hover:scale-105'}`}
                          style={{ background: `linear-gradient(135deg, ${persona.color} 0%, ${persona.secondaryColor} 100%)`, boxShadow: persona.speaking ? `0 0 40px ${persona.color}80` : 'none' }}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-white font-bold text-lg">{persona.name}</h3>
                        <p className="text-white/60 text-sm">{persona.role}</p>
                        {persona.speaking && <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: persona.color }} />}
                        <div className="absolute bottom-3">
                          <SpeakingBars isSpeaking={persona.speaking} color={persona.color} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Start Speaking Button */}
              <div className="flex justify-center mb-6">
                <button onClick={() => isListening ? stopListening() : startListening()}
                  className={`flex items-center gap-3 px-8 py-4 rounded-full font-semibold transition-all ${isListening ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-gradient-to-r from-[#8B5A2B] to-[#D2B48C] text-white shadow-lg shadow-[#8B5A2B]/30 hover:shadow-[#8B5A2B]/50'}`}>
                  <Mic className="w-5 h-5" />
                  {isListening ? 'Stop Speaking' : 'Start Speaking'}
                </button>
              </div>

              {/* Live Transcript */}
              {liveTranscript && (
                <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                  <p className="text-white/80">{liveTranscript}</p>
                </div>
              )}

              {/* Conversation */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col h-64">
                <div className="px-4 py-3 border-b border-white/10">
                  <h3 className="text-white font-semibold text-sm">Conversation</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.filter(m => m.text).map((msg, index) => {
                    const msgPersona = msg.sender === 'candidate' ? null : getPersonaById(msg.panelMemberId || '');
                    return (
                      <div key={index} className="flex items-start gap-3">
                        {msg.sender !== 'candidate' && msgPersona && (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: msgPersona.color }}>
                            {msgPersona.name[0]}
                          </div>
                        )}
                        {msg.sender === 'candidate' && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B5A2B] to-[#D2B48C] flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">Y</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-xs text-white/50 mb-1">
                            {msg.sender === 'candidate' ? 'You' : msgPersona?.name}
                            <span className="ml-2 text-white/30">{msgPersona?.shortRole}</span>
                          </p>
                          <p className="text-white/80 text-sm leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Right - Panel Members */}
            <div className="w-72 bg-white/5 backdrop-blur-xl border-l border-white/10 p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-white/60" /> Panel Members
              </h3>
              <div className="space-y-3">
                {personas.map((persona) => (
                  <div key={persona.id} onClick={() => setSelectedPersona(persona)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedPersona?.id === persona.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: persona.color }}>
                      <span className="text-white font-bold text-sm">{persona.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{persona.name}</p>
                      <p className="text-white/50 text-xs">{persona.role}</p>
                    </div>
                    {persona.speaking && <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: persona.color }} />}
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <input type="text" value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-white/10 rounded-full text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50" />
                  <button onClick={handleSend} className="p-2.5 bg-[#8B5A2B] text-white rounded-full hover:bg-[#6d4620] transition-colors">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* End Session */}
              <button onClick={endInterview} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors">
                <PhoneOff className="w-4 h-4" />
                <span className="text-sm font-medium">End Session</span>
              </button>
            </div>
          </div>
        {/* Hidden audio element */}
        <audio ref={audioRef} className="hidden" />
      </main>
  );
  }

  // Render SUMMARY step
  if (step === 'summary' && summary) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#8B5A2B] to-[#D2B48C] rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Interview Complete!</h1>
            <p className="text-white/60">Here is how you performed</p>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-white mb-2">{summary.overallScore}%</div>
              <div className="text-white/60">Overall Score</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">Strengths</h3>
                <ul className="space-y-2">
                  {summary.keyStrengths.map((s, i) => (
                    <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                      <span className="text-green-400">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">Areas to Improve</h3>
                <ul className="space-y-2">
                  {summary.areasToImprove.map((s, i) => (
                    <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                      <span className="text-yellow-400">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => { setStep('setup'); setSession(null); setMessages([]); setSummary(null); setTopic(''); setCompany(''); }}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all">
                Start New Interview
              </button>
              <button onClick={() => router.push('/dashboard')}
                className="flex-1 py-3 bg-gradient-to-r from-[#8B5A2B] to-[#D2B48C] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#8B5A2B]/30 transition-all">
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
