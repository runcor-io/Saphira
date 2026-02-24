import { useEffect, useRef, useState } from 'react'
import { Mic, PhoneOff, MessageSquare, Clock, ChevronLeft, MoreVertical } from 'lucide-react'
import '../App.css'

// Waveform animation component
function WaveformAnimation({ isActive, intensity = 1 }: { isActive: boolean; intensity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const timeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
      ctx.scale(2, 2)
    }
    resize()
    window.addEventListener('resize', resize)

    // Animation loop
    const animate = () => {
      timeRef.current += 0.02 * intensity
      const time = timeRef.current

      ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2)

      const centerX = canvas.offsetWidth / 2
      const centerY = canvas.offsetHeight / 2

      // Draw multiple flowing rings
      for (let ring = 0; ring < 5; ring++) {
        const ringOffset = ring * 0.4
        const points: { x: number; y: number }[] = []

        for (let i = 0; i <= 360; i += 3) {
          const angle = (i * Math.PI) / 180
          const wave1 = Math.sin(angle * 3 + time + ringOffset) * 15
          const wave2 = Math.sin(angle * 5 + time * 1.5 + ringOffset) * 10
          const wave3 = Math.cos(angle * 2 + time * 0.8 + ringOffset) * 8
          
          const baseRadius = 60 + ring * 25
          const radius = baseRadius + wave1 + wave2 + wave3

          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius
          points.push({ x, y })
        }

        // Draw the flowing path
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        
        for (let i = 1; i < points.length; i++) {
          const xc = (points[i].x + points[i - 1].x) / 2
          const yc = (points[i].y + points[i - 1].y) / 2
          ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc)
        }
        
        ctx.closePath()

        // Gradient stroke
        const gradient = ctx.createLinearGradient(0, 0, canvas.offsetWidth, canvas.offsetHeight)
        gradient.addColorStop(0, '#8B5A2B')
        gradient.addColorStop(0.3, '#D2B48C')
        gradient.addColorStop(0.6, '#8B5A2B')
        gradient.addColorStop(1, '#D2B48C')

        ctx.strokeStyle = gradient
        ctx.lineWidth = 2 + ring * 0.5
        ctx.globalAlpha = isActive ? 0.6 + Math.sin(time + ring) * 0.3 : 0.2
        ctx.stroke()

        // Fill with subtle glow
        ctx.fillStyle = gradient
        ctx.globalAlpha = isActive ? 0.05 + Math.sin(time * 2 + ring) * 0.03 : 0.02
        ctx.fill()
      }

      // Center glow effect
      if (isActive) {
        const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 80)
        glowGradient.addColorStop(0, 'rgba(139, 90, 43, 0.3)')
        glowGradient.addColorStop(0.5, 'rgba(210, 180, 140, 0.1)')
        glowGradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = glowGradient
        ctx.globalAlpha = 0.5 + Math.sin(time * 3) * 0.2
        ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, intensity])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ filter: isActive ? 'drop-shadow(0 0 20px rgba(139, 90, 43, 0.5))' : 'none' }}
    />
  )
}

// Particle effect for speaking
function SpeakingParticles({ isActive }: { isActive: boolean }) {
  if (!isActive) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-[#8B5A2B] rounded-full"
          style={{
            left: '50%',
            top: '50%',
            animation: `particleFloat 2s ease-out ${i * 0.15}s infinite`,
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  )
}

interface Message {
  sender: 'ai' | 'user'
  text: string
}

export default function AIInterview() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState<Message[]>([
    { sender: 'ai', text: 'Good morning! I am your interviewer today for the Loan Officer position at GTBank. Shall we begin?' },
    { sender: 'user', text: 'Good morning! Yes, I am ready. Thank you for having me.' },
    { sender: 'ai', text: 'Excellent. Let us start with your background. Can you tell me about your experience with financial analysis and customer relationship management?' },
  ])
  const [currentInput, setCurrentInput] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Simulate AI speaking
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeaking(true)
      setTimeout(() => setIsSpeaking(false), 3000)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSend = () => {
    if (!currentInput.trim()) return
    setTranscript([...transcript, { sender: 'user', text: currentInput }])
    setCurrentInput('')
    // Simulate AI response
    setTimeout(() => {
      setIsSpeaking(true)
      setTimeout(() => {
        setTranscript(prev => [...prev, { 
          sender: 'ai', 
          text: 'That is a great point. Can you elaborate on how you handled a challenging situation with a client?' 
        }])
        setIsSpeaking(false)
      }, 2000)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E0E0E0] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#F5F5F0] rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-[#888888]" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#8B5A2B] rounded-full flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-[#2F2F2F]">GTBank Interview</h1>
                <p className="text-sm text-[#888888]">Loan Officer Position</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[#888888]">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{formatTime(elapsedTime)}</span>
            </div>
            <button className="p-2 hover:bg-[#F5F5F0] rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-[#888888]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Left Panel - Animation */}
        <div className="w-1/2 bg-gradient-to-br from-[#2F2F2F] to-[#1a1a1a] relative overflow-hidden">
          {/* Background grid pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(139, 90, 43, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139, 90, 43, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Central Animation Container */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[400px] h-[400px]">
              {/* Outer glow ring */}
              <div 
                className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
                  isSpeaking ? 'border-[#8B5A2B] scale-110 opacity-60' : 'border-[#8B5A2B]/30 scale-100 opacity-30'
                }`}
                style={{
                  animation: isSpeaking ? 'pulse 2s ease-in-out infinite' : 'none',
                }}
              />
              
              {/* Waveform Animation */}
              <div className="absolute inset-0">
                <WaveformAnimation isActive={isSpeaking} intensity={isSpeaking ? 1.5 : 0.5} />
              </div>

              {/* Speaking Particles */}
              <SpeakingParticles isActive={isSpeaking} />

              {/* Center Avatar */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className={`w-24 h-24 rounded-full bg-gradient-to-br from-[#8B5A2B] to-[#D2B48C] flex items-center justify-center transition-all duration-300 ${
                    isSpeaking ? 'scale-110 shadow-lg shadow-[#8B5A2B]/50' : 'scale-100'
                  }`}
                >
                  <div className="w-20 h-20 rounded-full bg-[#2F2F2F] flex items-center justify-center">
                    <span className="text-white font-bold text-lg">AI</span>
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                <div 
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isSpeaking 
                      ? 'bg-[#8B5A2B] text-white' 
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  {isSpeaking ? '● Speaking' : 'Listening...'}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between text-white/80">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5" />
                  <span className="text-sm">Interviewer Voice</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8B5A2B] rounded-full transition-all duration-100"
                      style={{ width: isSpeaking ? `${50 + Math.random() * 40}%` : '20%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div className="w-1/2 bg-white flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="text-center mb-6">
              <span className="inline-block px-4 py-2 bg-[#F5F5F0] rounded-full text-sm text-[#888888]">
                Interview Started
              </span>
            </div>
            
            {transcript.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    msg.sender === 'user'
                      ? 'bg-[#8B5A2B] text-white'
                      : 'bg-[#F5F5F0] text-[#2F2F2F]'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-[#E0E0E0] p-4">
            <div className="flex items-center gap-3">
              <button 
                className={`p-3 rounded-full transition-all ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-[#F5F5F0] text-[#888888] hover:bg-[#E0E0E0]'
                }`}
                onClick={() => setIsListening(!isListening)}
              >
                <Mic className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your response..."
                  className="w-full px-4 py-3 bg-[#F5F5F0] rounded-full text-[#2F2F2F] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]"
                />
              </div>
              <button 
                onClick={handleSend}
                className="p-3 bg-[#8B5A2B] text-white rounded-full hover:bg-[#6d4620] transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* End Call Button */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <button className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors shadow-lg">
          <PhoneOff className="w-5 h-5" />
          End Interview
        </button>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 0.3; }
        }
        
        @keyframes particleFloat {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.8;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translate(
              calc(-50% + ${Math.random() * 200 - 100}px), 
              calc(-50% - ${100 + Math.random() * 100}px)
            ) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
