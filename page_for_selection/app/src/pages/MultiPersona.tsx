import { useEffect, useRef, useState } from 'react'
import { Mic, PhoneOff, MessageSquare, ChevronLeft, Users, Crown, TrendingUp, UserCircle, Zap, Settings, BarChart3, Home } from 'lucide-react'
import '../App.css'

// Persona data with colors
const personas = [
  {
    id: 'ceo',
    name: 'Dr. Olusola',
    role: 'CEO',
    shortRole: 'CEO',
    color: '#8B5A2B',
    secondaryColor: '#D2B48C',
    icon: Crown,
    description: 'Strategic, visionary leadership',
    speaking: false,
  },
  {
    id: 'cfo',
    name: 'Mrs. Adeyemi',
    role: 'CFO',
    shortRole: 'CFO',
    color: '#2E7D32',
    secondaryColor: '#81C784',
    icon: TrendingUp,
    description: 'Financial analysis & scrutiny',
    speaking: false,
  },
  {
    id: 'hr',
    name: 'Mr. Adesokan',
    role: 'HR Director',
    shortRole: 'HR',
    color: '#1565C0',
    secondaryColor: '#64B5F6',
    icon: UserCircle,
    description: 'People & culture focused',
    speaking: false,
  },
  {
    id: 'cto',
    name: 'Engr. Okonkwo',
    role: 'CTO',
    shortRole: 'CTO',
    color: '#6A1B9A',
    secondaryColor: '#BA68C8',
    icon: Zap,
    description: 'Technical & innovation driven',
    speaking: false,
  },
]

// Waveform animation component with custom colors
function PersonaWaveform({ 
  isActive, 
  color, 
  secondaryColor,
}: { 
  isActive: boolean
  color: string
  secondaryColor: string
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
      timeRef.current += isActive ? 0.05 : 0.02
      const time = timeRef.current

      ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2)

      const centerX = canvas.offsetWidth / 2
      const centerY = canvas.offsetHeight / 2

      // Draw flowing rings with persona colors
      for (let ring = 0; ring < 5; ring++) {
        const ringOffset = ring * 0.6
        const points: { x: number; y: number }[] = []

        for (let i = 0; i <= 360; i += 5) {
          const angle = (i * Math.PI) / 180
          const intensity = isActive ? 1.5 : 0.5
          const wave1 = Math.sin(angle * 3 + time + ringOffset) * (15 * intensity)
          const wave2 = Math.sin(angle * 5 + time * 1.3 + ringOffset) * (10 * intensity)
          const wave3 = Math.cos(angle * 2 + time * 0.8 + ringOffset) * (8 * intensity)
          
          const baseRadius = 45 + ring * 18
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
        const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 120)
        gradient.addColorStop(0, color)
        gradient.addColorStop(0.5, secondaryColor)
        gradient.addColorStop(1, color + '60')

        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.globalAlpha = isActive ? 0.8 + Math.sin(time * 2 + ring) * 0.2 : 0.2
        ctx.stroke()

        // Fill glow
        ctx.fillStyle = gradient
        ctx.globalAlpha = isActive ? 0.1 + Math.sin(time * 3 + ring) * 0.05 : 0.03
        ctx.fill()
      }

      // Center glow when speaking
      if (isActive) {
        const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 80)
        glowGradient.addColorStop(0, color + '66')
        glowGradient.addColorStop(0.5, secondaryColor + '33')
        glowGradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = glowGradient
        ctx.globalAlpha = 0.7 + Math.sin(time * 5) * 0.2
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
  }, [isActive, color, secondaryColor])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ 
        filter: isActive ? `drop-shadow(0 0 30px ${color}99)` : 'none',
        transition: 'filter 0.3s ease'
      }}
    />
  )
}

// Speaking sound bars
function SpeakingBars({ isSpeaking, color }: { isSpeaking: boolean; color: string }) {
  if (!isSpeaking) return null

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
  )
}

export default function MultiPersona() {
  const [activePersonas, setActivePersonas] = useState(personas)
  const [selectedPersona, setSelectedPersona] = useState(personas[0])
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
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
      }, 3000)
    }, 6000)

    return () => clearInterval(interval)
  }, [activePersonas])

  const handleSend = () => {
    if (!currentInput.trim()) return
    setTranscript([...transcript, { sender: 'user', text: currentInput }])
    setCurrentInput('')
  }

  const getPersonaById = (id: string) => personas.find(p => p.id === id) || personas[0]

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(ellipse at 20% 20%, rgba(139, 90, 43, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, rgba(106, 27, 154, 0.1) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(21, 101, 192, 0.08) 0%, transparent 60%)
            `,
          }}
        />
        {/* Animated gradient orbs */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
          style={{
            background: 'linear-gradient(135deg, #8B5A2B 0%, #D2B48C 100%)',
            top: '10%',
            left: '10%',
            animation: 'float 20s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-15"
          style={{
            background: 'linear-gradient(135deg, #6A1B9A 0%, #BA68C8 100%)',
            bottom: '10%',
            right: '10%',
            animation: 'float 25s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Left Sidebar */}
      <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col relative z-10">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#8B5A2B] to-[#D2B48C] rounded-xl flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Saphire</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {[
            { icon: Home, label: 'Dashboard', active: false },
            { icon: Mic, label: 'Interview', active: true },
            { icon: Users, label: 'Presentation', active: false },
            { icon: BarChart3, label: 'Feedback', active: false },
            { icon: Settings, label: 'Settings', active: false },
          ].map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#8B5A2B] to-[#D2B48C] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">YO</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">You</p>
              <p className="text-white/50 text-xs">Free Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-white/60" />
            </button>
            <div>
              <h1 className="text-white font-semibold">Executive Panel</h1>
              <p className="text-white/50 text-sm">Board Presentation Simulation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {personas.map((p) => (
                <div 
                  key={p.id}
                  className="w-8 h-8 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name[0]}
                </div>
              ))}
            </div>
            <span className="text-white/50 text-sm">4 Panelists</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left - Main Stage */}
          <div className="flex-1 p-6 flex flex-col">
            {/* Personas Grid */}
            <div className="flex-1 grid grid-cols-2 gap-4 mb-6">
              {activePersonas.map((persona) => {
                const Icon = persona.icon
                const isSelected = selectedPersona.id === persona.id

                return (
                  <div
                    key={persona.id}
                    onClick={() => setSelectedPersona(persona)}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group ${
                      isSelected ? 'ring-2 ring-white/30' : ''
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${persona.color}15 0%, ${persona.secondaryColor}08 100%)`,
                      border: `1px solid ${persona.color}30`,
                    }}
                  >
                    {/* Glass overlay */}
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />

                    {/* Animation */}
                    <div className="absolute inset-0">
                      <PersonaWaveform 
                        isActive={persona.speaking} 
                        color={persona.color}
                        secondaryColor={persona.secondaryColor}
                      />
                    </div>

                    {/* Persona Content */}
                    <div className="relative h-full flex flex-col items-center justify-center p-4">
                      {/* Avatar */}
                      <div 
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                          persona.speaking ? 'scale-110' : 'group-hover:scale-105'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${persona.color} 0%, ${persona.secondaryColor} 100%)`,
                          boxShadow: persona.speaking ? `0 0 40px ${persona.color}80` : 'none',
                        }}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Name & Role */}
                      <h3 className="text-white font-bold text-lg">{persona.name}</h3>
                      <p className="text-white/60 text-sm">{persona.role}</p>

                      {/* Speaking indicator */}
                      {persona.speaking && (
                        <div 
                          className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full animate-pulse"
                          style={{ backgroundColor: persona.color }}
                        />
                      )}

                      {/* Sound bars at bottom */}
                      <div className="absolute bottom-3">
                        <SpeakingBars isSpeaking={persona.speaking} color={persona.color} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Start Speaking Button */}
            <div className="flex justify-center mb-6">
              <button 
                onClick={() => setIsUserSpeaking(!isUserSpeaking)}
                className={`flex items-center gap-3 px-8 py-4 rounded-full font-semibold transition-all ${
                  isUserSpeaking 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' 
                    : 'bg-gradient-to-r from-[#8B5A2B] to-[#D2B48C] text-white shadow-lg shadow-[#8B5A2B]/30 hover:shadow-[#8B5A2B]/50'
                }`}
              >
                <Mic className="w-5 h-5" />
                {isUserSpeaking ? 'Stop Speaking' : 'Start Speaking'}
              </button>
            </div>

            {/* Conversation */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col h-64">
              <div className="px-4 py-3 border-b border-white/10">
                <h3 className="text-white font-semibold text-sm">Conversation</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {transcript.map((msg, index) => {
                  const msgPersona = msg.sender === 'user' ? null : getPersonaById(msg.sender)
                  
                  return (
                    <div key={index} className="flex items-start gap-3">
                      {msg.sender !== 'user' && msgPersona && (
                        <div 
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                          style={{ backgroundColor: msgPersona.color }}
                        >
                          {msgPersona.name[0]}
                        </div>
                      )}
                      {msg.sender === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B5A2B] to-[#D2B48C] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">Y</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-xs text-white/50 mb-1">
                          {msg.sender === 'user' ? 'You' : msgPersona?.name}
                          <span className="ml-2 text-white/30">{msgPersona?.shortRole}</span>
                        </p>
                        <p className="text-white/80 text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right - Panel Members */}
          <div className="w-72 bg-white/5 backdrop-blur-xl border-l border-white/10 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-white/60" />
              Panel Members
            </h3>
            <div className="space-y-3">
              {personas.map((persona) => (
                <div 
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    selectedPersona.id === persona.id 
                      ? 'bg-white/10' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: persona.color }}
                  >
                    <span className="text-white font-bold text-sm">{persona.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{persona.name}</p>
                    <p className="text-white/50 text-xs">{persona.role}</p>
                  </div>
                  {persona.speaking && (
                    <div 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: persona.color }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-white/10 rounded-full text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50"
                />
                <button 
                  onClick={handleSend}
                  className="p-2.5 bg-[#8B5A2B] text-white rounded-full hover:bg-[#6d4620] transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* End Session */}
            <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors">
              <PhoneOff className="w-4 h-4" />
              <span className="text-sm font-medium">End Session</span>
            </button>
          </div>
        </div>
      </main>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(50px, -30px); }
          50% { transform: translate(-30px, 50px); }
          75% { transform: translate(30px, 30px); }
        }
        
        @keyframes soundBar {
          0% { height: 4px; }
          100% { height: 20px; }
        }
      `}</style>
    </div>
  )
}
