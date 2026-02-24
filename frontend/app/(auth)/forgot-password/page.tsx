'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement password reset
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-linen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
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
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                />
              </div>

              <button
                type="submit"
                className="w-full bg-wood text-white py-2.5 rounded-xl font-semibold hover:bg-wood-dark transition-colors"
              >
                Send Reset Link
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
