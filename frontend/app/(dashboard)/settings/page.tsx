'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Lock, 
  Bell, 
  Trash2, 
  Loader2, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Mic,
  Users,
  Home,
  BarChart3,
  Settings,
  Crown
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [practiceReminders, setPracticeReminders] = useState(true);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  const supabase = createClient();

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') {
      setMessage({ type: 'error', text: 'Please type DELETE to confirm' });
      return;
    }

    setDeleting(true);
    try {
      setMessage({ 
        type: 'error', 
        text: 'Account deletion requires contacting support. Please email support@saphira.ai' 
      });
      setDeleteDialogOpen(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete account' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-40" style={{
          background: `radial-gradient(ellipse at 20% 20%, rgba(139, 90, 43, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(106, 27, 154, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(21, 101, 192, 0.08) 0%, transparent 60%)`
        }} />
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-20" style={{
          background: 'linear-gradient(135deg, #8B5A2B 0%, #D2B48C 100%)', top: '10%', left: '10%', animation: 'float 20s ease-in-out infinite',
        }} />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-15" style={{
          background: 'linear-gradient(135deg, #6A1B9A 0%, #BA68C8 100%)', bottom: '10%', right: '10%', animation: 'float 25s ease-in-out infinite reverse',
        }} />
      </div>

      {/* Left Sidebar */}
      <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col relative z-10">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#8B5A2B] to-[#D2B48C] rounded-xl flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Saphire</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { icon: Home, label: 'Dashboard', active: false, href: '/dashboard' },
            { icon: Mic, label: 'Interview', active: false, href: '/saphira-interview' },
            { icon: Users, label: 'Presentation', active: false, href: '/presentation' },
            { icon: BarChart3, label: 'Feedback', active: false, href: '/feedback' },
            { icon: Settings, label: 'Settings', active: true, href: '/settings' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </button>
            <div>
              <h1 className="text-white font-semibold">Settings</h1>
              <p className="text-white/50 text-sm">Manage your account preferences</p>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Status Message */}
            {message && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${
                message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                {message.text}
              </div>
            )}

            {/* Change Password */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#8B5A2B]/20 rounded-lg flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[#8B5A2B]" />
                  </div>
                  Change Password
                </h2>
                <p className="text-white/50 text-sm mt-1">Update your password to keep your account secure</p>
              </div>
              <div className="p-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50"
                        required
                      />
                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50"
                        required
                        minLength={8}
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-white/40 mt-1">Must be at least 8 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/50"
                      required
                    />
                  </div>

                  <button type="submit" disabled={loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#8B5A2B] to-[#D2B48C] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#8B5A2B]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#8B5A2B]/20 rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4 text-[#8B5A2B]" />
                  </div>
                  Notifications
                </h2>
                <p className="text-white/50 text-sm mt-1">Manage how we communicate with you</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Email Notifications</p>
                    <p className="text-sm text-white/50">Receive updates about new features</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Practice Reminders</p>
                    <p className="text-sm text-white/50">Weekly reminders to practice</p>
                  </div>
                  <Switch checked={practiceReminders} onCheckedChange={setPracticeReminders} />
                </div>
              </div>
            </div>

            {/* Delete Account */}
            <div className="bg-red-500/5 backdrop-blur-xl rounded-2xl border border-red-500/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-red-500/20">
                <h2 className="font-semibold text-red-400 flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </div>
                  Delete Account
                </h2>
                <p className="text-white/50 text-sm mt-1">Permanently delete your account and all data</p>
              </div>
              <div className="p-6">
                <p className="text-sm text-white/50 mb-4">
                  This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                </p>
                
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="px-6 py-2.5 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-all">
                      Delete Account
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1a1a1f] border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Are you absolutely sure?
                      </DialogTitle>
                      <DialogDescription className="text-white/50">
                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <p className="text-sm text-white/50">
                        Please type <strong className="text-white">DELETE</strong> to confirm:
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        placeholder="Type DELETE"
                      />
                    </div>
                    
                    <DialogFooter>
                      <button onClick={() => setDeleteDialogOpen(false)} className="px-4 py-2 text-white/60 hover:text-white transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleDeleteAccount} disabled={deleting || deleteConfirmText !== 'DELETE'}
                        className="px-6 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : 'Delete Account'}
                      </button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(50px, -30px); }
          50% { transform: translate(-30px, 50px); }
          75% { transform: translate(30px, 30px); }
        }
      `}</style>
    </div>
  );
}
