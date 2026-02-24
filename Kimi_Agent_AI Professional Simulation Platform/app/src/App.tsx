import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ChevronDown, Mic, Users, Target, Award, Zap, Globe, CheckCircle, ArrowRight, Play, Sparkles } from 'lucide-react'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

// Features data
const features = [
  {
    icon: Mic,
    title: 'Voice-Driven AI',
    description: 'Speak naturally with AI interviewers and executives. Our technology understands and responds like a real person.',
  },
  {
    icon: Users,
    title: 'Multi-Persona Simulation',
    description: 'Practice with multiple AI characters — CEOs, CFOs, HR executives — each with unique personalities and questioning styles.',
  },
  {
    icon: Target,
    title: 'Nigerian Localization',
    description: 'Authentic Nigerian accents, corporate communication patterns, and cultural context you won\'t find anywhere else.',
  },
  {
    icon: Award,
    title: 'Real-Time Feedback',
    description: 'Get instant coaching on your answers, confidence, clarity, and executive presence after every session.',
  },
  {
    icon: Zap,
    title: 'Practice Anytime',
    description: 'No scheduling needed. Practice interviews and presentations whenever you want, as many times as you need.',
  },
  {
    icon: Globe,
    title: 'Scenario Builder',
    description: 'From job interviews to executive presentations, sales pitches to performance reviews — simulate any professional situation.',
  },
]

// How it works steps
const steps = [
  {
    number: '01',
    title: 'Choose Your Scenario',
    description: 'Select from job interviews, presentations, meetings, or create a custom simulation.',
  },
  {
    number: '02',
    title: 'Meet Your AI Panel',
    description: 'Interact with realistic AI personas — each with their own voice, personality, and role.',
  },
  {
    number: '03',
    title: 'Practice & Improve',
    description: 'Get real-time feedback and coaching to sharpen your skills with every session.',
  },
]

// Pricing plans
const pricingPlans = [
  {
    name: 'Pay-Per-Use',
    price: '₦1,000',
    period: 'per simulation',
    description: 'Perfect for occasional practice',
    features: [
      'Full access to all scenarios',
      'Real-time feedback',
      'Session recordings',
      'No commitment',
    ],
    highlighted: false,
    cta: 'Get Started',
  },
  {
    name: 'Unlimited',
    price: '₦5,000',
    period: 'per month',
    description: 'Best for serious preparation',
    features: [
      'Unlimited simulations',
      'All scenario types',
      'Priority support',
      'Progress tracking',
      'Advanced analytics',
    ],
    highlighted: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'annual licensing',
    description: 'For organizations & teams',
    features: [
      'Unlimited users',
      'Custom scenarios',
      'Dedicated support',
      'Team analytics',
      'API access',
    ],
    highlighted: false,
    cta: 'Contact Sales',
  },
]

function App() {
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  // Loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1200)
    return () => clearTimeout(timer)
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

      // Scroll reveal animations
      gsap.utils.toArray<HTMLElement>('.reveal-section').forEach((section) => {
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

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#F5F5F0]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#8B5A2B] rounded-lg flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-[#2F2F2F]">Saphire</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#888888] hover:text-[#8B5A2B] transition-colors">Features</a>
              <a href="#how-it-works" className="text-[#888888] hover:text-[#8B5A2B] transition-colors">How It Works</a>
              <a href="#pricing" className="text-[#888888] hover:text-[#8B5A2B] transition-colors">Pricing</a>
            </div>
            <button className="bg-[#8B5A2B] text-white px-5 py-2 rounded-full font-medium hover:bg-[#6d4620] transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-12"
      >
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#8B5A2B]/10 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-[#8B5A2B]" />
            <span className="text-sm text-[#8B5A2B] font-medium">Nigeria's First AI Interview Simulator</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#2F2F2F] leading-tight mb-6">
            Master Your Career Moments
            <span className="block text-[#8B5A2B]">Before They Happen</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-[#888888] max-w-2xl mx-auto mb-10 leading-relaxed">
            Practice job interviews, executive presentations, and high-stakes meetings with AI personas that sound and act like real Nigerian professionals.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button className="w-full sm:w-auto bg-[#8B5A2B] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#6d4620] transition-colors flex items-center justify-center gap-2">
              Start Practicing Now
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto bg-white text-[#2F2F2F] px-8 py-4 rounded-full font-semibold text-lg border border-[#E0E0E0] hover:bg-[#F5F5F0] transition-colors flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              See How It Works
            </button>
          </div>

          {/* Hero Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
            <img 
              src="/runcor_interview.jpg" 
              alt="AI Interview Simulation" 
              className="w-full h-64 sm:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 bg-[#8B5A2B] rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs font-bold">CEO</span>
                </div>
                <div className="w-10 h-10 bg-[#D2B48C] rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs font-bold">CFO</span>
                </div>
                <div className="w-10 h-10 bg-[#2F2F2F] rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs font-bold">HR</span>
                </div>
              </div>
              <p className="text-white text-sm">Practice with multiple AI executives</p>
            </div>
          </div>
        </div>

        <div className="mt-12 scroll-bounce">
          <ChevronDown className="w-8 h-8 text-[#8B5A2B] mx-auto" />
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[#888888] mb-6">Trusted by professionals from</p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 opacity-60">
            {['GTBank', 'Access Bank', 'KPMG', 'PWC', 'Shell', 'Unilever'].map((company) => (
              <span key={company} className="text-xl font-bold text-[#2F2F2F]">{company}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="reveal-section py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#2F2F2F] mb-6">
                Most People Fail Interviews <span className="text-[#8B5A2B]">Not Because They Can't Do The Job</span>
              </h2>
              <p className="text-lg text-[#888888] mb-8">
                They fail because they weren't prepared for the pressure, the unexpected questions, and the real-world dynamics of professional conversations.
              </p>
              <div className="space-y-4">
                {[
                  'YouTube videos don\'t ask follow-up questions',
                  'Reading questions isn\'t the same as answering them',
                  'Friends can\'t simulate real executive pressure',
                  'Generic AI tools don\'t understand Nigerian corporate culture',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-600 text-xs">✕</span>
                    </div>
                    <span className="text-[#2F2F2F]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#8B5A2B] rounded-3xl p-8 text-white">
              <Target className="w-12 h-12 mb-6" />
              <p className="text-xl leading-relaxed mb-6">
                Practice makes perfect. The more you simulate real situations, the more confident you become when it matters most.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Build Confidence</p>
                  <p className="text-white/70 text-sm">Through realistic practice</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="reveal-section py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2F2F2F] mb-4">
              Everything You Need to <span className="text-[#8B5A2B]">Ace Any Professional Situation</span>
            </h2>
            <p className="text-lg text-[#888888] max-w-2xl mx-auto">
              From your first job interview to your first board presentation — we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-[#F5F5F0] rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-[#8B5A2B] rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#2F2F2F] mb-3">{feature.title}</h3>
                <p className="text-[#888888]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="reveal-section py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2F2F2F] mb-4">
              Practice in <span className="text-[#8B5A2B]">3 Simple Steps</span>
            </h2>
            <p className="text-lg text-[#888888]">No setup. No scheduling. Just practice.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="bg-white rounded-2xl shadow-lg p-8 h-full">
                  <span className="text-5xl font-bold text-[#8B5A2B]/20">{step.number}</span>
                  <h3 className="text-xl font-bold text-[#2F2F2F] mt-4 mb-3">{step.title}</h3>
                  <p className="text-[#888888]">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-[#8B5A2B]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section className="reveal-section py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#2F2F2F] mb-6">
                Simulate Any <span className="text-[#8B5A2B]">Career Situation</span>
              </h2>
              <p className="text-lg text-[#888888] mb-8">
                Whether you're preparing for your first job or your next promotion, we have scenarios designed for every stage of your career.
              </p>
              <div className="space-y-4">
                {[
                  { title: 'Job Interviews', desc: 'Banking, consulting, tech, and more' },
                  { title: 'Executive Presentations', desc: 'Board meetings, investor pitches' },
                  { title: 'Performance Reviews', desc: 'Practice giving and receiving feedback' },
                  { title: 'Sales Meetings', desc: 'Client presentations and negotiations' },
                ].map((scenario) => (
                  <div key={scenario.title} className="flex items-center gap-4 p-4 bg-[#F5F5F0] rounded-xl">
                    <CheckCircle className="w-6 h-6 text-[#8B5A2B] flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-[#2F2F2F]">{scenario.title}</p>
                      <p className="text-sm text-[#888888]">{scenario.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-xl">
              <img 
                src="/runcor_ai.jpg" 
                alt="AI Simulation" 
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#8B5A2B]/80 to-transparent flex items-end">
                <div className="p-8">
                  <p className="text-white text-xl font-bold mb-2">Experience Real Pressure</p>
                  <p className="text-white/80">Our AI adapts to your answers just like a real interviewer would.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="reveal-section py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2F2F2F] mb-4">
              Simple, Transparent <span className="text-[#8B5A2B]">Pricing</span>
            </h2>
            <p className="text-lg text-[#888888]">Choose what works best for you. No hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <div 
                key={plan.name} 
                className={`rounded-2xl p-8 ${plan.highlighted ? 'bg-[#8B5A2B] text-white shadow-xl scale-105' : 'bg-[#F5F5F0] text-[#2F2F2F]'}`}
              >
                <p className={`text-sm font-medium mb-2 ${plan.highlighted ? 'text-white/80' : 'text-[#888888]'}`}>
                  {plan.name}
                </p>
                <p className="text-4xl font-bold mb-1">{plan.price}</p>
                <p className={`text-sm mb-6 ${plan.highlighted ? 'text-white/70' : 'text-[#888888]'}`}>
                  {plan.period}
                </p>
                <p className={`mb-8 ${plan.highlighted ? 'text-white/90' : 'text-[#888888]'}`}>
                  {plan.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle className={`w-5 h-5 ${plan.highlighted ? 'text-white' : 'text-[#8B5A2B]'}`} />
                      <span className={plan.highlighted ? 'text-white/90' : 'text-[#2F2F2F]'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  className={`w-full py-3 rounded-full font-semibold transition-colors ${
                    plan.highlighted 
                      ? 'bg-white text-[#8B5A2B] hover:bg-[#F5F5F0]' 
                      : 'bg-[#8B5A2B] text-white hover:bg-[#6d4620]'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="reveal-section py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#8B5A2B] rounded-3xl p-8 sm:p-12 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Ace Your Next Interview?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Join thousands of Nigerian professionals who are practicing smarter with Saphire. Your first simulation is just ₦1,000.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto bg-white text-[#8B5A2B] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#F5F5F0] transition-colors">
                Start Practicing Now
              </button>
              <p className="text-white/60 text-sm">No signup required for pay-per-use</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="reveal-section py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2F2F2F] mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'How realistic are the AI personas?', a: 'Our AI uses advanced voice technology to create Nigerian-accented personas that sound and respond like real professionals. They ask follow-up questions, challenge your answers, and adapt to your responses.' },
              { q: 'Can I practice for specific companies?', a: 'Yes! You can select industry-specific scenarios (banking, consulting, tech) and our AI will tailor questions accordingly. We\'re constantly adding more company-specific scenarios.' },
              { q: 'Do I get feedback after each session?', a: 'Absolutely. After every simulation, you\'ll receive detailed feedback on your answers, confidence level, clarity, and areas for improvement.' },
              { q: 'Is my data private?', a: 'Yes. All your practice sessions are private and secure. We never share your data with third parties.' },
            ].map((faq) => (
              <div key={faq.q} className="bg-[#F5F5F0] rounded-xl p-6">
                <p className="font-semibold text-[#2F2F2F] mb-2">{faq.q}</p>
                <p className="text-[#888888]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[#2F2F2F]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#8B5A2B] rounded-lg flex items-center justify-center">
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Saphire</span>
              </div>
              <p className="text-white/60 text-sm">
                Africa's first AI-powered professional simulation platform.
              </p>
            </div>
            <div>
              <p className="text-white font-semibold mb-4">Product</p>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-4">Company</p>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-4">Legal</p>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-white/40 text-sm">© 2024 Saphire. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
