import { useEffect, useRef, useState } from 'react'
import { Mic, PhoneOff, MessageSquare, ChevronLeft, Users, Crown, TrendingUp, UserCircle } from 'lucide-react'
import '../App.css'

// Persona data with colors
const personas = [
  {
    id: 'ceo',
    name: 'CEO',
    fullName: 'Chief Executive Officer',
    color: '#8B5A2B',
    secondaryColor: '#D2B48C',
    icon: Crown,
    description: 'Strategic, visionary, big-picture thinker',
    speaking: false,
  },
  {
    id: 'cfo',
    name: 'CFO',
    fullName: 'Chief Financial Officer',
    color: '#2E7D32',
    secondaryColor: '#81C784',
    icon: TrendingUp,
    description: 'Analytical, numbers-focused, detail-oriented',
    speaking: false,
  },
  {
    id: 'hr',
    name: 'HR Director',
    fullName: 'Human Resources Director',
    color: '#1565C0',
    secondaryColor: '#64B5F6',
    icon: UserCircle,
    description: 'People-focused, behavioral, culture guardian',
    speaking: false,
  },
  {
    id: 'cto',
    name: 'CTO',
    fullName: 'Chief Technical Officer',
    color: '#6A1B9A',
    secondaryColor: '#BA68C8',
    icon: Mic,
    description: 'Technical, innovative, solution-driven',
    speaking: false,
  },
]

// Waveform animation component with custom colors
function PersonaWaveform({ 
  isActive, 
  color, 
  secondaryColor,
  intensity = 1 
}: { 
  isActive: boolean
  color: string
  secondaryColor: string
  intensity?: number 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const timeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
      ctx.scale(2, 2)
    }
    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      timeRef.current += 0.025 * intensity
      const time = timeRef.current

      ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2)

      const centerX = canvas.offsetWidth / 2
      const centerY = canvas.offsetHeight / 2

      // Draw multiple flowing rings with persona colors
      for (let ring = 0; ring < 4; ring++) {
        const ringOffset = ring * 0.5
        const points: { x: number; y: number }[] = []

        for (let i = 0; i <= 360; i += 4) {
          const angle = (i * Math.PI) / 180
          const wave1 = Math.sin(angle * 4 + time + ringOffset) * (12 + ring * 3)
          const wave2 = Math.sin(angle * 6 + time * 1.3 + ringOffset) * (8 + ring * 2)
          const wave3 = Math.cos(angle * 3 + time * 0.9 + ringOffset) * (6 + ring)
          
          const baseRadius = 50 + ring * 20
          const radius = baseRadius + wave1 + wave2 + wave3

          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius
          points.push({ x, y })
        }

        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        
        for (let i = 1; i < points.length; i++) {
          const xc = (points[i].x + points[i - 1].x) / 2
          const yc = (points[i].y + points[i - 1].y) / 2
          ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc)
        }
        
        ctx.closePath()

        // Create gradient with persona colors
        const gradient = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, 150)
        gradient.addColorStop(0, color)
        gradient.addColorStop(0.5, secondaryColor)
        gradient.addColorStop(1, color)

        ctx.strokeStyle = gradient
        ctx.lineWidth = 2.5
        ctx.globalAlpha = isActive ? 0.7 + Math.sin(time + ring) * 0.25 : 0.15
        ctx.stroke()

        // Fill glow
        ctx.fillStyle = gradient
        ctx.globalAlpha = isActive ? 0.08 + Math.sin(time * 2 + ring) * 0.04 : 0.02
        ctx.fill()
      }

      // Center glow when speaking
      if (isActive) {
        const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100)
        glowGradient.addColorStop(0, color + '4D') // 30% opacity
        glowGradient.addColorStop(0.5, secondaryColor + '1A') // 10% opacity
        glowGradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = glowGradient
        ctx.globalAlpha = 0.6 + Math.sin(time * 4) * 0.2
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
  }, [isActive, color, secondaryColor, intensity])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ 
        filter: isActive ? `drop-shadow(0 0 25px ${color}80)` : 'none',
        transition: 'filter 0.3s ease'
      }}
    />
  )
}

// Active speaker indicator
function SpeakingIndicator({ isSpeaking, color }: { isSpeaking: boolean; color: string }) {
  if (!isSpeaking) return null

  return (
    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-1.5 h-4 rounded-full"
          style={{
            backgroundColor: color,
            animation: `soundBar 0.5s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
    </div>
  )
}

export default function MultiPersona() {
  const [activePersonas, setActivePersonas] = useState(personas)
  const [selectedPersona, setSelectedPersona] = useState(personas[0])
  const [transcript, setTranscript] = useState([
    { sender: 'ceo', text: 'Good morning. Thank you for joining us today. I would like to start by understanding your vision for this role.' },
    { sender: 'cfo', text: 'Before we get to that, I would like to see your financial projections. What assumptions did you make?' },
    { sender: 'user', text: 'Thank you all for having me. My projections are based on market research and conservative growth estimates...' },
    { sender: 'hr', text: 'That is helpful. Can you tell us about a time you had to handle conflict within a team?' },
  ])
  const [currentInput, setCurrentInput] = useState('')

  // Simulate personas speaking
  useEffect(() => {
    const interval = setInterval(() => {
      const randomPersona = activePersonas[Math.floor(Math.random() * activePersonas.length)]
      
      setActivePersonas(prev => prev.map(p => ({
        ...p,
        speaking: p.id === randomPersona.id
      })))

      setTimeout(() => {
        setActivePersonas(prev => prev.map(p => ({ ...p, speaking: false })))
      }, 2500)
    }, 5000)

    return () => clearInterval(interval)
  }, [activePersonas])

  const handleSend = () => {
    if (!currentInput.trim()) return
    setTranscript([...transcript, { sender: 'user', text: currentInput }])
    setCurrentInput('')
  }

  const getPersonaById = (id: string) => personas.find(p => p.id === id) || personas[0]

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E0E0E0] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#F5F5F0] rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-[#888888]" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#8B5A2B] rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-[#2F2F2F]">Executive Panel</h1>
                <p className="text-sm text-[#888888]">Board Presentation Simulation</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {personas.map((p) => (
                <div 
                  key={p.id}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name[0]}
                </div>
              ))}
            </div>
            <span className="text-sm text-[#888888]">4 Panelists</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Left Panel - Personas Grid */}
        <div className="w-3/5 bg-gradient-to-br from-[#2F2F2F] to-[#1a1a1a] p-6 relative overflow-hidden">
          {/* Background pattern */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
              backgroundSize: '30px 30px',
            }}
          />

          {/* Personas Grid */}
          <div className="relative h-full grid grid-cols-2 grid-rows-2 gap-4">
            {activePersonas.map((persona) => {
              const Icon = persona.icon
              const isSelected = selectedPersona.id === persona.id

              return (
                <div
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                    isSelected ? 'ring-2 ring-white/50' : ''
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${persona.color}20 0%, ${persona.secondaryColor}10 100%)`,
                    border: `1px solid ${persona.color}40`,
                  }}
                >
                  {/* Animation */}
                  <div className="absolute inset-0">
                    <PersonaWaveform 
                      isActive={persona.speaking} 
                      color={persona.color}
                      secondaryColor={persona.secondaryColor}
                      intensity={persona.speaking ? 1.8 : 0.6}
                    />
                  </div>

                  {/* Persona Info */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    {/* Avatar */}
                    <div 
                      className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                        persona.speaking ? 'scale-110' : 'scale-100'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${persona.color} 0%, ${persona.secondaryColor} 100%)`,
                        boxShadow: persona.speaking ? `0 0 30px ${persona.color}80` : 'none',
                      }}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Name */}
                    <h3 className="text-white font-bold text-lg">{persona.name}</h3>
                    <p className="text-white/60 text-xs text-center mt-1">{persona.description}</p>

                    {/* Speaking indicator */}
                    {persona.speaking && (
                      <div 
                        className="absolute top-3 right-3 w-3 h-3 rounded-full animate-pulse"
                        style={{ backgroundColor: persona.color }}
                      />
                    )}

                    {/* Speaking indicator bars */}
                    <SpeakingIndicator isSpeaking={persona.speaking} color={persona.color} />
                  </div>

                  {/* Bottom status bar */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-300"
                    style={{
                      backgroundColor: persona.speaking ? persona.color : 'transparent',
                      opacity: persona.speaking ? 1 : 0,
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* Central "You" indicator */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <span className="text-[#2F2F2F] font-bold">You</span>
                </div>
                <div>
                  <p className="text-white font-medium">Presenting</p>
                  <p className="text-white/60 text-sm">Q3 Growth Strategy</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div className="w-2/5 bg-white flex flex-col">
          {/* Selected Persona Info */}
          <div 
            className="p-4 border-b border-[#E0E0E0]"
            style={{
              background: `linear-gradient(90deg, ${selectedPersona.color}10 0%, transparent 100%)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: selectedPersona.color }}
              >
                <selectedPersona.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#2F2F2F]">{selectedPersona.fullName}</h3>
                <p className="text-sm text-[#888888]">{selectedPersona.description}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-center mb-4">
              <span className="inline-block px-3 py-1 bg-[#F5F5F0] rounded-full text-xs text-[#888888]">
                Board Meeting Started
              </span>
            </div>
            
            {transcript.map((msg, index) => {
              const msgPersona = msg.sender === 'user' ? null : getPersonaById(msg.sender)
              
              return (
                <div
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start gap-2 max-w-[90%]">
                    {msg.sender !== 'user' && msgPersona && (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: msgPersona.color }}
                      >
                        <span className="text-white text-xs font-bold">{msgPersona.name[0]}</span>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        msg.sender === 'user'
                          ? 'bg-[#8B5A2B] text-white'
                          : 'bg-[#F5F5F0] text-[#2F2F2F]'
                      }`}
                    >
                      {msg.sender !== 'user' && msgPersona && (
                        <p className="text-xs font-medium mb-1" style={{ color: msgPersona.color }}>
                          {msgPersona.name}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Input Area */}
          <div className="border-t border-[#E0E0E0] p-4">
            <div className="flex items-center gap-2">
              <button className="p-2.5 bg-[#F5F5F0] text-[#888888] rounded-full hover:bg-[#E0E0E0] transition-colors">
                <Mic className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Respond to the panel..."
                  className="w-full px-4 py-2.5 bg-[#F5F5F0] rounded-full text-sm text-[#2F2F2F] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]"
                />
              </div>
              <button 
                onClick={handleSend}
                className="p-2.5 bg-[#8B5A2B] text-white rounded-full hover:bg-[#6d4620] transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* End Call Button */}
      <div className="absolute bottom-6 left-[30%] transform -translate-x-1/2 z-10">
        <button className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors shadow-lg text-sm">
          <PhoneOff className="w-4 h-4" />
          End Session
        </button>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes soundBar {
          0% { height: 4px; }
          100% { height: 20px; }
        }
      `}</style>
    </div>
  )
}
