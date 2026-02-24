'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a session (from the reset link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl">🔷</span>
          <span className="text-xl font-bold text-charcoal">SAPHIRA</span>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <Link 
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-charcoal mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          {success ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="font-semibold text-charcoal mb-2">Password Updated!</h2>
              <p className="text-gray-500 text-sm mb-4">
                Your password has been successfully reset.
              </p>
              <p className="text-gray-400 text-xs">
                Redirecting you to login...
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-charcoal mb-2">Create New Password</h1>
              <p className="text-gray-500 text-sm mb-6">
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-linen rounded-xl text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-wood/20"
                      required
                      disabled={loading}
                      minLength={8}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-linen rounded-xl text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-wood/20"
                      required
                      disabled={loading}
                      minLength={8}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-wood text-white py-2.5 rounded-xl font-semibold hover:bg-wood-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
