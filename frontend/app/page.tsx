'use client';

import Link from 'next/link';
import { 
  Mic, 
  Users, 
  Target, 
  Award, 
  ArrowRight, 
  Play,
  Briefcase,
  MessageSquare,
  Sparkles
} from 'lucide-react';

// Simple feature cards
const features = [
  {
    icon: Mic,
    title: 'Voice-First AI',
    description: 'Hear realistic AI voices with natural African accents, personalities, and real executive behavior.',
  },
  {
    icon: Users,
    title: 'Multi-Persona Panels',
    description: 'Practice with CEOs, HR executives, and technical leads — each with unique personalities.',
  },
  {
    icon: Target,
    title: 'Realistic Professional Simulation',
    description: 'Practice interviews, presentations, investor pitches, and meetings with AI panelists that behave like real executives and recruiters.',
  },
  {
    icon: Award,
    title: 'Instant Feedback',
    description: 'Get real-time scoring and coaching to improve with every session.',
  },
];

// Use cases
const useCases = [
  { title: 'Job Interviews', icon: Briefcase },
  { title: 'Investor Pitch Meetings', icon: Users },
  { title: 'Board Presentations', icon: Users },
  { title: 'Product Demo Practice', icon: Mic },
  { title: 'Performance Reviews', icon: MessageSquare },
  { title: 'Embassy Interviews', icon: Briefcase },
];

// Practice modes
const practiceModes = [
  {
    icon: Briefcase,
    title: 'Job Interviews',
    description: 'Banking, consulting, tech, and more',
    href: '/saphira-interview',
    color: 'bg-wood',
  },
  {
    icon: Users,
    title: 'Board Presentations',
    description: 'Executive pitches to senior leadership',
    href: '/presentation',
    color: 'bg-charcoal',
  },
  {
    icon: MessageSquare,
    title: 'Classic Interview',
    description: 'Traditional one-on-one practice',
    href: '/interview',
    color: 'bg-green-600',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-linen/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo + Text */}
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold text-charcoal tracking-tight">SAPHIRA</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/login"
                className="text-sm text-gray-600 hover:text-charcoal transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/saphira-interview"
                className="bg-wood text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-wood-dark transition-colors"
              >
                Start Practicing
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-wood/10 rounded-full px-3 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-wood" />
            <span className="text-xs text-wood font-medium">Nigeria&apos;s First AI Interview Simulator</span>
          </div>
          
          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal leading-tight mb-5">
            Practice Interviews, Presentations, and Meetings with AI
          </h1>
          
          {/* Subheadline */}
          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Practice with realistic AI panels trained for African professional environments. Prepare for interviews, investor pitches, board meetings, and presentations.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              href="/saphira-interview"
              className="w-full sm:w-auto bg-wood text-white px-6 py-3 rounded-full font-semibold hover:bg-wood-dark transition-colors flex items-center justify-center gap-2"
            >
              Start Practicing
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/test"
              className="w-full sm:w-auto bg-white text-charcoal px-6 py-3 rounded-full font-semibold border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Try Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Country Personalization Strip */}
      <section className="py-4 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-gray-400 mb-2">Built for African professionals</p>
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full">
              <span className="text-base">🇳🇬</span> Nigeria
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full">
              <span className="text-base">🇰🇪</span> Kenya
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full">
              <span className="text-base">🇿🇦</span> South Africa
            </span>
          </div>
        </div>
      </section>

      {/* Practice Modes */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-lg font-semibold text-charcoal mb-6">Choose Your Practice Mode</h2>
          
          <div className="grid sm:grid-cols-3 gap-4">
            {practiceModes.map((mode) => (
              <Link
                key={mode.title}
                href={mode.href}
                className="group bg-linen rounded-2xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className={`w-10 h-10 ${mode.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <mode.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-charcoal mb-1">{mode.title}</h3>
                <p className="text-sm text-gray-500">{mode.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-charcoal mb-2">Built for Nigerian Professionals</h2>
            <p className="text-gray-500 text-sm">Everything you need to ace your next career moment</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="w-9 h-9 bg-wood/10 rounded-lg flex items-center justify-center mb-3">
                  <feature.icon className="w-4.5 h-4.5 text-wood" />
                </div>
                <h3 className="font-semibold text-charcoal text-sm mb-1">{feature.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-charcoal text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold mb-2">Practice in 3 Steps</h2>
            <p className="text-white/60 text-sm">No setup. No scheduling. Just practice.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Pick a Scenario', desc: 'Job interview, presentation, or custom simulation' },
              { step: '2', title: 'Meet the Panel', desc: 'AI personas with unique voices and personalities' },
              { step: '3', title: 'Get Feedback', desc: 'Real-time scoring and improvement tips' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-wood rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-white/60 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practice Any Professional Scenario */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-linen">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-charcoal mb-2">Practice Any Professional Scenario</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="w-9 h-9 bg-wood/10 rounded-lg flex items-center justify-center mb-3">
                  <item.icon className="w-4.5 h-4.5 text-wood" />
                </div>
                <h3 className="font-semibold text-charcoal text-sm">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Panel Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-charcoal mb-2">Meet Your AI Panel</h2>
            <p className="text-gray-500 text-sm">Each with their own voice, personality, and questioning style</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: 'Chief Okafor', role: 'CEO', style: 'Direct, ROI-focused', color: 'bg-purple-600' },
              { name: 'Mrs. Adebayo', role: 'CFO', style: 'Analytical, numbers-driven', color: 'bg-green-600' },
              { name: 'Engr. Nnamdi', role: 'CTO', style: 'Technical, detailed', color: 'bg-blue-600' },
            ].map((member) => (
              <div key={member.name} className="bg-white rounded-xl p-5 border border-gray-100 text-center">
                <div className={`w-14 h-14 ${member.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-white font-bold">{member.name.split(' ').pop()?.[0]}</span>
                </div>
                <h3 className="font-semibold text-charcoal text-sm">{member.name}</h3>
                <p className="text-wood text-xs font-medium mb-1">{member.role}</p>
                <p className="text-gray-400 text-xs">{member.style}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emotional Hook */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-charcoal mb-4">
            Stop walking into important meetings unprepared.
          </h2>
          <p className="text-lg text-gray-500">
            Practice until you are confident.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-wood rounded-2xl p-8 text-center text-white">
            <h2 className="text-xl font-bold mb-3">Ready to Practice?</h2>
            <p className="text-white/80 text-sm mb-6">
              Join professionals preparing smarter with SAPHIRA. Start with a free demo.
            </p>
            <Link 
              href="/saphira-interview"
              className="inline-flex items-center gap-2 bg-white text-wood px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-linen transition-colors"
            >
              Start Practicing Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
              <span className="font-bold text-charcoal">SAPHIRA</span>
            </div>
            
            {/* Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link href="/saphira-interview" className="text-gray-500 hover:text-charcoal transition-colors">Practice</Link>
              <Link href="/presentation" className="text-gray-500 hover:text-charcoal transition-colors">Presentation</Link>
              <Link href="/dashboard" className="text-gray-500 hover:text-charcoal transition-colors">Dashboard</Link>
            </div>
            
            {/* Copyright */}
            <p className="text-gray-400 text-xs">© 2024 SAPHIRA</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
