import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'
import { ChevronDown, Rocket, AlertCircle, Lightbulb, Target, Users, TrendingUp, Shield, Zap, Clock, Award, CheckCircle, Mic, DollarSign, ExternalLink } from 'lucide-react'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

// Revenue projection data
const revenueProjections = [
  { phase: 'Phase 1 (Months 1-3)', users: '100-300', revenue: '₦100k-300k', profit: '₦70k-250k' },
  { phase: 'Phase 2 (Months 6-12)', users: '1,000', revenue: '₦1M/month', profit: '₦800k/month' },
  { phase: 'Phase 3 (18-24 Months)', users: '5,000', revenue: '₦5M/month', profit: '₦4M/month' },
  { phase: 'Phase 4 (3-5 Years)', users: '20,000', revenue: '₦20M/month', profit: '₦15M/month' },
]

// Monthly revenue projection
const monthlyRevenue = [
  { month: 'Month 1', revenue: '₦50k' },
  { month: 'Month 2', revenue: '₦100k' },
  { month: 'Month 3', revenue: '₦200k' },
  { month: 'Month 6', revenue: '₦500k' },
  { month: 'Month 12', revenue: '₦1M' },
]

function App() {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])

  // Loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = (scrollTop / docHeight) * 100
      setProgress(scrollPercent)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // GSAP Animations
  useEffect(() => {
    if (loading) return

    const ctx = gsap.context(() => {
      // Hero animation
      gsap.fromTo(heroRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.3 }
      )

      // Section reveal animations
      sectionRefs.current.forEach((section) => {
        if (!section) return
        
        gsap.fromTo(section,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            }
          }
        )
      })
    }, containerRef)

    return () => ctx.revert()
  }, [loading])

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#F5F5F0]">
      {/* Loading Screen */}
      {loading && (
        <div className="loading-screen fixed inset-0 z-50 flex items-center justify-center bg-[#F5F5F0]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#8B5A2B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#2F2F2F] text-lg font-medium">Loading Saphire...</p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#E0E0E0] z-40">
        <div 
          className="progress-bar h-full bg-[#8B5A2B]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-1 left-0 right-0 z-30 bg-[#F5F5F0]/95 backdrop-blur-sm border-b border-[#E0E0E0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#8B5A2B] rounded-lg flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-[#2F2F2F]">Saphire</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                to="/interview" 
                className="text-sm text-[#888888] hover:text-[#8B5A2B] transition-colors flex items-center gap-1"
              >
                AI Interview
                <ExternalLink className="w-3 h-3" />
              </Link>
              <Link 
                to="/panel" 
                className="text-sm text-[#888888] hover:text-[#8B5A2B] transition-colors flex items-center gap-1"
              >
                Multi-Persona
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Comprehensive Overview */}
      <section 
        ref={heroRef}
        className="min-h-screen px-4 sm:px-6 lg:px-8 py-20 relative"
      >
        {/* Header */}
        <div className="text-center max-w-5xl mx-auto mb-20">
          <p className="text-[#8B5A2B] text-sm uppercase tracking-[0.3em] mb-6 font-medium">
            Nigeria-First, Globally Scalable
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-[#2F2F2F] leading-none mb-6 tracking-tight">
            Saphire
          </h1>
          <p className="text-xl sm:text-2xl text-[#8B5A2B] font-medium mb-8">
            AI Professional Simulation Platform
          </p>
          <p className="text-xl sm:text-2xl text-[#888888] max-w-3xl mx-auto leading-relaxed">
            We are building Africa's first AI-powered professional simulation platform that prepares students and professionals for real-world career situations through immersive, voice-driven, culturally accurate simulations.
          </p>
        </div>

        {/* Vision Card */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="bg-white rounded-3xl shadow-lg p-8 sm:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#8B5A2B] rounded-full flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#2F2F2F]">Our Vision</h2>
            </div>
            <p className="text-lg text-[#2F2F2F] leading-relaxed mb-6">
              We are building Africa's first AI-powered professional simulation platform. Our solution prepares students and professionals for real-world career situations through immersive, voice-driven, culturally accurate simulations.
            </p>
            <div className="bg-[#F5F5F0] rounded-xl p-6 border-l-4 border-[#8B5A2B]">
              <p className="text-[#888888] italic">
                We will eliminate career unpreparedness by allowing anyone to experience and master critical professional moments before they happen in real life.
              </p>
            </div>
          </div>
        </div>

        {/* Problem & Solution Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 mb-16">
          {/* The Problem */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#2F2F2F]">The Problem We Solve</h2>
            </div>
            <p className="text-[#2F2F2F] mb-4">
              Millions across Africa face career-defining situations without adequate preparation:
            </p>
            <ul className="space-y-2 mb-6">
              {['Job interviews', 'Executive presentations', 'Investor pitches', 'Internal corporate reviews', 'Client meetings'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-[#888888]">
                  <span className="w-1.5 h-1.5 bg-[#8B5A2B] rounded-full"></span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-red-700 text-sm">
                <strong>We solve what existing methods fail at:</strong> Static questions, expensive coaching, and generic AI tools that lack Nigerian cultural relevance.
              </p>
            </div>
          </div>

          {/* The Solution */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#2F2F2F]">Our Solution</h2>
            </div>
            <p className="text-[#2F2F2F] mb-4">
              We offer an AI simulation platform that recreates real professional scenarios with voice-enabled AI personas.
            </p>
            <div className="space-y-4">
              <div className="bg-[#F5F5F0] rounded-xl p-4">
                <p className="font-semibold text-[#8B5A2B] mb-1">Interview Scenarios</p>
                <p className="text-sm text-[#888888]">We provide GTBank Loan Officer prep with Nigerian-accented AI interviewer</p>
              </div>
              <div className="bg-[#F5F5F0] rounded-xl p-4">
                <p className="font-semibold text-[#8B5A2B] mb-1">Executive Presentations</p>
                <p className="text-sm text-[#888888]">We simulate multi-persona meetings: CEO, CFO, HR, Technical Director</p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Features */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2F2F2F] text-center mb-10">What We Offer</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Mic, title: 'Voice-Driven AI', desc: 'We provide fully conversational interaction powered by OpenAI and ElevenLabs' },
              { icon: Users, title: 'Multi-Persona Simulation', desc: 'We create multiple AI characters with unique voices, personalities, and roles' },
              { icon: Target, title: 'Nigerian Localization', desc: 'We deliver authentic accents, tone, and corporate communication patterns' },
              { icon: Award, title: 'Real-Time Feedback', desc: 'We offer answer improvement, communication coaching, and confidence analysis' },
              { icon: Zap, title: 'Scenario Builder', desc: 'We enable simulations for interviews, presentations, pitches, meetings, and reviews' },
            ].map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <feature.icon className="w-8 h-8 text-[#8B5A2B] mb-4" />
                <h3 className="font-bold text-[#2F2F2F] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#888888]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Target Market & Revenue */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-[#2F2F2F] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#8B5A2B]" /> Who We Serve: Students
            </h3>
            <p className="text-sm text-[#888888]">We help students and graduates prepare for job interviews, internships, and NYSC placements</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-[#2F2F2F] mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#8B5A2B]" /> Who We Serve: Professionals
            </h3>
            <p className="text-sm text-[#888888]">We support working professionals preparing for presentations, promotions, and executive meetings</p>
          </div>
          <div className="bg-[#8B5A2B] rounded-2xl shadow-lg p-6 text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Who We Serve: Enterprise
            </h3>
            <p className="text-sm text-white/80">We partner with banks, consulting firms, universities, training institutes, and government agencies</p>
          </div>
        </div>

        {/* Business Model */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-[#2F2F2F] mb-6">How We Deliver Value</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-[#F5F5F0] rounded-xl">
                <p className="text-3xl font-bold text-[#8B5A2B] mb-2">₦3k-10k</p>
                <p className="text-sm text-[#888888]">Monthly Subscription We Offer</p>
              </div>
              <div className="text-center p-4 bg-[#F5F5F0] rounded-xl">
                <p className="text-3xl font-bold text-[#8B5A2B] mb-2">₦1k</p>
                <p className="text-sm text-[#888888]">Pay-Per-Simulation We Provide</p>
              </div>
              <div className="text-center p-4 bg-[#8B5A2B] rounded-xl">
                <p className="text-3xl font-bold text-white mb-2">Enterprise</p>
                <p className="text-sm text-white/80">Annual Licensing We Deliver</p>
              </div>
            </div>
          </div>
        </div>

        {/* Competitive Advantage */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-[#8B5A2B] to-[#D2B48C] rounded-3xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-lg text-white/90 mb-4">
              While AI technology is becoming commoditized, <strong>we own the localization moat.</strong>
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {['We deliver Nigerian corporate simulation', 'We provide Nigerian voice and persona realism', 'We enable multi-executive simulation capability', 'We offer full professional situation training'].map((item) => (
                <div key={item} className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Positioning Statement */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="bg-white rounded-3xl shadow-lg p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-[#2F2F2F] mb-6">Our Promise</h2>
            <p className="text-xl sm:text-2xl text-[#8B5A2B] font-medium leading-relaxed mb-6">
              "We will help you experience your career's most important moments before they happen — through realistic AI simulations we build specifically for African professionals."
            </p>
            <div className="border-t border-[#E0E0E0] pt-6">
              <p className="text-sm text-[#888888] uppercase tracking-wider mb-2">What We Are Building</p>
              <p className="text-lg text-[#2F2F2F] font-medium">
                We are creating Africa's first AI-powered professional simulation platform for interviews, presentations, and career-critical situations.
              </p>
            </div>
          </div>
        </div>

        {/* Scroll CTA */}
        <div className="text-center">
          <p className="text-[#888888] mb-4">Continue scrolling to see why we will succeed — 18 strategic insights</p>
          <div className="scroll-bounce">
            <ChevronDown className="w-8 h-8 text-[#8B5A2B] mx-auto" />
          </div>
        </div>
      </section>

      {/* Enterprise Value Proposition */}
      <section 
        ref={el => { sectionRefs.current[0] = el }}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#2F2F2F] mb-6">
                This is the Feature That <span className="text-[#8B5A2B]">Companies Will Pay For</span>
              </h2>
              <p className="text-lg text-[#2F2F2F] mb-8">
                Companies spend huge money on professional development. We can replace expensive human coaches.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  'Presentation training',
                  'Executive coaching',
                  'Leadership development',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-4 p-4 bg-[#F5F5F0] rounded-xl">
                    <CheckCircle className="w-6 h-6 text-[#8B5A2B]" />
                    <span className="text-[#2F2F2F] font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#8B5A2B] rounded-xl p-6 text-white">
                <p className="text-lg">
                  <strong>We offer scalable AI-powered training</strong> at a fraction of the cost of human coaches.
                </p>
              </div>
            </div>
            <div className="bg-[#F5F5F0] rounded-3xl p-8">
              <h3 className="text-xl font-bold text-[#2F2F2F] mb-6">Traditional vs. Saphire</h3>
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6">
                  <p className="text-sm text-[#888888] mb-2">Traditional Executive Coaching</p>
                  <p className="text-3xl font-bold text-red-600">₦500K–2M</p>
                  <p className="text-sm text-[#888888]">per employee per year</p>
                </div>
                <div className="bg-[#8B5A2B] rounded-xl p-6 text-white">
                  <p className="text-sm text-white/80 mb-2">Saphire Enterprise License</p>
                  <p className="text-3xl font-bold">₦5M</p>
                  <p className="text-sm text-white/80">unlimited employees per year</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Massive Revenue Potential */}
      <section 
        ref={el => { sectionRefs.current[1] = el }}
        className="py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2F2F2F] mb-4">
              Revenue Potential Becomes <span className="text-[#8B5A2B]">Massive</span>
            </h2>
            <p className="text-lg text-[#888888]">Not exaggeration — if executed properly</p>
          </div>

          <div className="bg-gradient-to-br from-[#8B5A2B] to-[#D2B48C] rounded-3xl p-8 sm:p-12 text-white text-center mb-12">
            <p className="text-lg text-white/80 mb-4">This can become</p>
            <p className="text-6xl sm:text-7xl font-bold mb-4">$10M–$100M</p>
            <p className="text-xl text-white/90">company valuation</p>
          </div>

          <div className="text-center mb-8">
            <p className="text-lg text-[#2F2F2F] mb-2">Because we can sell to:</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { name: 'Banks', icon: '💰' },
              { name: 'Oil Companies', icon: '🛢️' },
              { name: 'Consulting Firms', icon: '💼' },
              { name: 'Government', icon: '🏛️' },
              { name: 'Universities', icon: '🎓' },
            ].map((org) => (
              <div key={org.name} className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <span className="text-4xl mb-3 block">{org.icon}</span>
                <p className="font-bold text-[#2F2F2F]">{org.name}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white rounded-3xl shadow-lg p-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-[#8B5A2B] mb-2">10</p>
                <p className="text-[#888888]">Enterprise Clients</p>
                <p className="text-sm text-[#8B5A2B] mt-1">₦50M/year</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#8B5A2B] mb-2">50</p>
                <p className="text-[#888888]">Enterprise Clients</p>
                <p className="text-sm text-[#8B5A2B] mt-1">₦250M/year</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#8B5A2B] mb-2">100</p>
                <p className="text-[#888888]">Enterprise Clients</p>
                <p className="text-sm text-[#8B5A2B] mt-1">₦500M/year</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Projections */}
      <section 
        ref={el => { sectionRefs.current[2] = el }}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2F2F2F] mb-4">Revenue Projections</h2>
            <p className="text-lg text-[#888888]">Realistic adoption, not viral explosion</p>
          </div>

          {/* Revenue Table */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#8B5A2B] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Phase</th>
                    <th className="px-6 py-4 text-left">Users/Month</th>
                    <th className="px-6 py-4 text-left">Revenue</th>
                    <th className="px-6 py-4 text-left">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueProjections.map((row, index) => (
                    <tr key={row.phase} className={index % 2 === 0 ? 'bg-[#F5F5F0]' : 'bg-white'}>
                      <td className="px-6 py-4 font-medium text-[#2F2F2F]">{row.phase}</td>
                      <td className="px-6 py-4 text-[#888888]">{row.users}</td>
                      <td className="px-6 py-4 font-bold text-[#8B5A2B]">{row.revenue}</td>
                      <td className="px-6 py-4 text-green-600">{row.profit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* First Year Projection */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-[#2F2F2F] mb-6">First Year Revenue</h3>
              <div className="space-y-4">
                {monthlyRevenue.map((row) => (
                  <div key={row.month} className="flex items-center gap-4">
                    <span className="w-24 text-sm text-[#888888]">{row.month}</span>
                    <div className="flex-1 h-8 bg-[#F5F5F0] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#8B5A2B] rounded-full flex items-center justify-end pr-3"
                        style={{ width: `${(parseInt(row.revenue.replace(/[^0-9]/g, '')) / 1000) * 10}%` }}
                      >
                        <span className="text-white text-sm font-medium">{row.revenue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-[#E0E0E0]">
                <div className="flex justify-between items-center">
                  <span className="text-[#888888]">Total Year 1 Revenue</span>
                  <span className="text-2xl font-bold text-[#8B5A2B]">₦4M–₦8M</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[#888888]">Profit</span>
                  <span className="text-lg font-bold text-green-600">₦3M–₦6M</span>
                </div>
              </div>
            </div>

            <div className="relative rounded-3xl overflow-hidden shadow-xl">
              <img 
                src="/runcor_growth.jpg" 
                alt="Growth Metrics" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Break-even */}
          <div className="mt-12 bg-green-50 rounded-2xl p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h3 className="text-2xl font-bold text-green-700">Break-Even Point</h3>
            </div>
            <p className="text-lg text-[#2F2F2F] mb-4">
              Monthly running cost: <strong>₦150,000</strong>
            </p>
            <p className="text-3xl font-bold text-[#8B5A2B] mb-2">
              Only 150 interviews/month needed
            </p>
            <p className="text-[#888888]">That's just 5 interviews per day — very achievable</p>
          </div>
        </div>
      </section>

      {/* Strategic Positioning */}
      <section 
        ref={el => { sectionRefs.current[3] = el }}
        className="py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#2F2F2F] mb-6">Strategic Positioning</h2>
              <div className="space-y-6">
                <div className="bg-red-50 rounded-xl p-6">
                  <p className="text-red-700 font-medium mb-2">We are NOT positioning as:</p>
                  <p className="text-[#2F2F2F]">An interview question generator</p>
                </div>
                <div className="bg-green-50 rounded-xl p-6">
                  <p className="text-green-700 font-medium mb-2">We ARE positioning as:</p>
                  <p className="text-[#2F2F2F] text-xl font-bold">Professional Simulation Infrastructure</p>
                </div>
              </div>
              <p className="mt-6 text-[#888888]">
                This is a broader and more defensible category. We are building the platform where professionals practice their careers.
              </p>
            </div>
            <div className="bg-[#8B5A2B] rounded-3xl p-8 text-white">
              <h3 className="text-xl font-bold mb-6">Long-Term Vision</h3>
              <div className="space-y-4">
                {[
                  'Presentation training',
                  'Leadership training',
                  'Career coaching',
                  'Hiring and talent assessment',
                  'Educational institution integration',
                  'Corporate training programs',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-white/20">
                <p className="text-white/80">
                  Over time, Saphire becomes a <strong>core layer in the professional development ecosystem.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section 
        ref={el => { sectionRefs.current[4] = el }}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2F2F2F] mb-4">Why Us</h2>
            <p className="text-lg text-[#888888]">We are positioned to define this category in our market</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Deep Understanding', desc: 'Nigerian and African professional landscape', icon: Target },
              { title: 'Technical Capability', desc: 'AI-powered SaaS product development', icon: Zap },
              { title: 'Early Positioning', desc: 'First-mover in emerging category', icon: Clock },
              { title: 'Speed & Agility', desc: 'Early-stage execution advantage', icon: Rocket },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <item.icon className="w-10 h-10 text-[#8B5A2B] mx-auto mb-4" />
                <h3 className="font-bold text-[#2F2F2F] mb-2">{item.title}</h3>
                <p className="text-sm text-[#888888]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Summary */}
      <section 
        ref={el => { sectionRefs.current[5] = el }}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-[#8B5A2B]"
      >
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8">Summary</h2>
          <p className="text-xl leading-relaxed mb-8 text-white/90">
            Saphire is building AI infrastructure that allows professionals to simulate and prepare for career-critical situations.
          </p>
          <p className="text-lg leading-relaxed mb-12 text-white/80">
            We are combining advances in conversational AI and voice technology with deep localization to create a new category of professional preparation tools.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <p className="text-2xl font-bold mb-4">
              This represents a significant opportunity to build a scalable, impactful, and defensible technology company.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[#2F2F2F]">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-3xl font-bold text-white mb-4">Saphire</p>
          <p className="text-white/60 mb-8">AI Professional Simulation Platform</p>
          <div className="flex flex-wrap justify-center gap-8 text-white/40 text-sm">
            <span>Low Startup Cost</span>
            <span>•</span>
            <span>High Margin</span>
            <span>•</span>
            <span>High Scalability</span>
            <span>•</span>
            <span>Fast Path to Profitability</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
