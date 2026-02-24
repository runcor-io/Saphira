'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSubmitted(true);
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

          <h1 className="text-2xl font-bold text-charcoal mb-2">Reset Password</h1>
          <p className="text-gray-500 text-sm mb-6">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="font-semibold text-charcoal mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm">
                We&apos;ve sent a password reset link to {email}
              </p>
              <p className="text-gray-400 text-xs mt-4">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-wood hover:underline"
                >
                  try again
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 bg-linen rounded-xl text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-wood/20"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-wood text-white py-2.5 rounded-xl font-semibold hover:bg-wood-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
