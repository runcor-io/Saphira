import { useState } from 'react'
import { 
  Mic, ChevronLeft, Briefcase, Plane, GraduationCap, TrendingUp, BookOpen, Users, 
  Mic2, Store, Radio, Play, Plus, Trash2, User, Settings, BarChart3, Home
} from 'lucide-react'
import '../App.css'

// Interview types
const interviewTypes = [
  { 
    id: 'job', 
    icon: Briefcase, 
    title: 'Job Interview', 
    desc: 'Practice job interviews with HR, technical, and leadership questions' 
  },
  { 
    id: 'visa', 
    icon: Plane, 
    title: 'Embassy/Visa Interview', 
    desc: 'Practice visa interviews for study, work, or travel abroad' 
  },
  { 
    id: 'scholarship', 
    icon: GraduationCap, 
    title: 'Scholarship Interview', 
    desc: 'Practice academic scholarship and PhD admission interviews' 
  },
  { 
    id: 'pitch', 
    icon: TrendingUp, 
    title: 'Business Pitch', 
    desc: 'Practice pitching to investors and securing funding' 
  },
  { 
    id: 'academic', 
    icon: BookOpen, 
    title: 'Academic Presentation', 
    desc: 'Practice thesis defense and academic presentations' 
  },
  { 
    id: 'board', 
    icon: Users, 
    title: 'Board Presentation', 
    desc: 'Practice executive presentations to senior leadership' 
  },
  { 
    id: 'conference', 
    icon: Mic2, 
    title: 'Conference Presentation', 
    desc: 'Practice presenting at professional conferences' 
  },
  { 
    id: 'exhibition', 
    icon: Store, 
    title: 'Exhibition/Trade Show', 
    desc: 'Practice demoing products to potential clients' 
  },
  { 
    id: 'media', 
    icon: Radio, 
    title: 'Media Interview', 
    desc: 'Practice handling press and media questions' 
  },
]

// Default panelists
const defaultPanelists = [
  { id: 'ceo', name: 'Dr. Olusola', role: 'CEO', color: '#8B5A2B' },
  { id: 'cfo', name: 'Mrs. Adeyemi', role: 'CFO', color: '#2E7D32' },
  { id: 'hr', name: 'Mr. Adesokan', role: 'HR Director', color: '#1565C0' },
  { id: 'cto', name: 'Engr. Okonkwo', role: 'CTO', color: '#6A1B9A' },
]

// Role options
const roleOptions = ['CEO', 'CFO', 'CTO', 'HR Director', 'COO', 'VP Engineering', 'Product Manager', 'Team Lead', 'Other']

interface CustomPanelist {
  id: string
  name: string
  gender: 'male' | 'female'
  demeanor: number // 0-100 (Aggressive to Soft)
  tone: number // 0-100 (Serious to Calm)
  attitude: number // 0-100 (Supportive to Against)
  role: string
}

export default function Setup() {
  const [selectedType, setSelectedType] = useState('job')
  const [panelMode, setPanelMode] = useState<'default' | 'custom'>('default')
  const [customPanelists, setCustomPanelists] = useState<CustomPanelist[]>([])
  const [topic, setTopic] = useState('')
  const [company, setCompany] = useState('')
  const [country, setCountry] = useState('NG Nigeria')

  const addCustomPanelist = () => {
    const newPanelist: CustomPanelist = {
      id: Date.now().toString(),
      name: '',
      gender: 'male',
      demeanor: 50,
      tone: 50,
      attitude: 50,
      role: 'CEO',
    }
    setCustomPanelists([...customPanelists, newPanelist])
  }

  const updatePanelist = (id: string, field: keyof CustomPanelist, value: string | number) => {
    setCustomPanelists(customPanelists.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const removePanelist = (id: string) => {
    setCustomPanelists(customPanelists.filter(p => p.id !== id))
  }

  const selectedTypeData = interviewTypes.find(t => t.id === selectedType)

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
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-white/60" />
            </button>
            <div>
              <h1 className="text-white font-semibold">Start Your Interview Session</h1>
              <p className="text-white/50 text-sm">Configure your practice interview settings below</p>
            </div>
          </div>
          <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="flex gap-6">
              {/* Left Column - Configuration */}
              <div className="flex-1 space-y-6">
                {/* Interview Type */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#8B5A2B]" />
                    Interview Type
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {interviewTypes.map((type) => {
                      const Icon = type.icon
                      const isSelected = selectedType === type.id
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          className={`p-4 rounded-xl text-left transition-all ${
                            isSelected 
                              ? 'bg-[#8B5A2B]/30 border border-[#8B5A2B]/50' 
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-[#8B5A2B]' : 'text-white/60'}`} />
                          <p className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-white/80'}`}>
                            {type.title}
                          </p>
                          <p className="text-white/40 text-xs mt-1 line-clamp-2">{type.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Session Details */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#8B5A2B]" />
                    Session Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/60 text-sm mb-2 block">Topic</label>
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter topic..."
                        className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 text-sm mb-2 block">Company/Institution (Optional)</label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g., Access Bank, Shell, Safaricom..."
                        className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 text-sm mb-2 block">Country Context</label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50 appearance-none cursor-pointer"
                      >
                        <option value="NG Nigeria" className="bg-[#1a1a1f]">🇳🇬 Nigeria</option>
                        <option value="GH Ghana" className="bg-[#1a1a1f]">🇬🇭 Ghana</option>
                        <option value="KE Kenya" className="bg-[#1a1a1f]">🇰🇪 Kenya</option>
                        <option value="ZA South Africa" className="bg-[#1a1a1f]">🇿🇦 South Africa</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Panel Setup */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#8B5A2B]" />
                    Panel Setup
                  </h3>

                  {/* Mode Selection */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => setPanelMode('default')}
                      className={`flex-1 p-4 rounded-xl border transition-all ${
                        panelMode === 'default'
                          ? 'bg-[#8B5A2B]/20 border-[#8B5A2B]/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          panelMode === 'default' ? 'border-[#8B5A2B]' : 'border-white/30'
                        }`}>
                          {panelMode === 'default' && <div className="w-2.5 h-2.5 rounded-full bg-[#8B5A2B]" />}
                        </div>
                        <span className="text-white font-medium">Use Default Panel</span>
                      </div>
                      <p className="text-white/50 text-sm pl-8">Uses preset panelists like Dr. Olusola, Mrs. Adeyemi</p>
                    </button>
                    <button
                      onClick={() => setPanelMode('custom')}
                      className={`flex-1 p-4 rounded-xl border transition-all ${
                        panelMode === 'custom'
                          ? 'bg-[#8B5A2B]/20 border-[#8B5A2B]/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          panelMode === 'custom' ? 'border-[#8B5A2B]' : 'border-white/30'
                        }`}>
                          {panelMode === 'custom' && <div className="w-2.5 h-2.5 rounded-full bg-[#8B5A2B]" />}
                        </div>
                        <span className="text-white font-medium">Customize Your Panel</span>
                      </div>
                      <p className="text-white/50 text-sm pl-8">Create your own panelists with custom personalities</p>
                    </button>
                  </div>

                  {/* Default Panel Preview */}
                  {panelMode === 'default' && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-white/60 text-sm mb-3">Your panel will include:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {defaultPanelists.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: p.color }}
                            >
                              <span className="text-white font-bold text-sm">{p.name[0]}</span>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{p.name}</p>
                              <p className="text-white/50 text-xs">{p.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Panel Builder */}
                  {panelMode === 'custom' && (
                    <div className="space-y-4">
                      {customPanelists.length === 0 && (
                        <div className="text-center py-8 bg-white/5 rounded-xl">
                          <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                          <p className="text-white/50 text-sm">No custom panelists yet</p>
                          <p className="text-white/30 text-xs mt-1">Add panelists to customize your interview</p>
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
                            <button
                              onClick={() => removePanelist(panelist.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="text-white/50 text-xs mb-1 block">Name</label>
                              <input
                                type="text"
                                value={panelist.name}
                                onChange={(e) => updatePanelist(panelist.id, 'name', e.target.value)}
                                placeholder="e.g., Chief Okafor"
                                className="w-full px-3 py-2 bg-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50"
                              />
                            </div>
                            <div>
                              <label className="text-white/50 text-xs mb-1 block">Role</label>
                              <select
                                value={panelist.role}
                                onChange={(e) => updatePanelist(panelist.id, 'role', e.target.value)}
                                className="w-full px-3 py-2 bg-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50 appearance-none cursor-pointer"
                              >
                                {roleOptions.map(role => (
                                  <option key={role} value={role} className="bg-[#1a1a1f]">{role}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="text-white/50 text-xs mb-2 block">Gender (determines voice)</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updatePanelist(panelist.id, 'gender', 'male')}
                                className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                                  panelist.gender === 'male'
                                    ? 'bg-[#8B5A2B] text-white'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                                }`}
                              >
                                Male
                              </button>
                              <button
                                onClick={() => updatePanelist(panelist.id, 'gender', 'female')}
                                className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                                  panelist.gender === 'female'
                                    ? 'bg-[#8B5A2B] text-white'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                                }`}
                              >
                                Female
                              </button>
                            </div>
                          </div>

                          {/* Sliders */}
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-white/50">Demeanor</span>
                                <span className="text-white/40">
                                  {panelist.demeanor < 30 ? 'Aggressive' : panelist.demeanor > 70 ? 'Soft' : 'Balanced'}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={panelist.demeanor}
                                onChange={(e) => updatePanelist(panelist.id, 'demeanor', parseInt(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#8B5A2B]"
                              />
                              <div className="flex justify-between text-xs mt-1">
                                <span className="text-white/30">Aggressive</span>
                                <span className="text-white/30">Soft</span>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-white/50">Tone</span>
                                <span className="text-white/40">
                                  {panelist.tone < 30 ? 'Serious' : panelist.tone > 70 ? 'Calm' : 'Balanced'}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={panelist.tone}
                                onChange={(e) => updatePanelist(panelist.id, 'tone', parseInt(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#8B5A2B]"
                              />
                              <div className="flex justify-between text-xs mt-1">
                                <span className="text-white/30">Serious</span>
                                <span className="text-white/30">Calm</span>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-white/50">Attitude</span>
                                <span className="text-white/40">
                                  {panelist.attitude < 30 ? 'Against' : panelist.attitude > 70 ? 'Supportive' : 'Neutral'}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={panelist.attitude}
                                onChange={(e) => updatePanelist(panelist.id, 'attitude', parseInt(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#8B5A2B]"
                              />
                              <div className="flex justify-between text-xs mt-1">
                                <span className="text-white/30">Against</span>
                                <span className="text-white/30">Supportive</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={addCustomPanelist}
                        className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:text-white hover:border-white/40 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Add Panelist
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
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Type</span>
                      <span className="text-white">{selectedTypeData?.title}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Topic</span>
                      <span className="text-white">{topic || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Company</span>
                      <span className="text-white">{company || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Country</span>
                      <span className="text-white">{country}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Panel Size</span>
                      <span className="text-white">
                        {panelMode === 'default' ? '4' : customPanelists.length || 'Auto'}
                      </span>
                    </div>
                  </div>

                  {/* Panel Preview */}
                  <div className="mb-6">
                    <p className="text-white/50 text-xs mb-3">Panel Members</p>
                    <div className="space-y-2">
                      {panelMode === 'default' ? (
                        defaultPanelists.map((p) => (
                          <div key={p.id} className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: p.color }}
                            >
                              {p.name[0]}
                            </div>
                            <span className="text-white/80 text-sm">{p.name}</span>
                            <span className="text-white/40 text-xs">{p.role}</span>
                          </div>
                        ))
                      ) : (
                        customPanelists.length > 0 ? (
                          customPanelists.map((p) => (
                            <div key={p.id} className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#8B5A2B] flex items-center justify-center text-xs font-bold text-white">
                                {p.name[0] || '?'}
                              </div>
                              <span className="text-white/80 text-sm">{p.name || 'Unnamed'}</span>
                              <span className="text-white/40 text-xs">{p.role}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-white/30 text-sm italic">No panelists added yet</p>
                        )
                      )}
                    </div>
                  </div>

                  <button className="w-full py-3 bg-gradient-to-r from-[#8B5A2B] to-[#D2B48C] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#8B5A2B]/30 transition-all flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" />
                    Start Session
                  </button>
                </div>
              </div>
            </div>
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
      `}</style>
    </div>
  )
}
