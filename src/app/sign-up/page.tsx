'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setConfirmed(true);
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#141414] border border-[#2a2a2a] rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-gray-400 text-sm mb-6">
            We&apos;ve sent a confirmation link to <strong className="text-white">{email}</strong>.
            Click the link to activate your account.
          </p>
          <p className="text-gray-500 text-xs">
            Already confirmed?{' '}
            <Link href="/sign-in" className="text-blue-400 hover:text-blue-300">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#141414] border border-[#2a2a2a] rounded-xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-gray-400 mb-8 text-sm">Start building amazing websites today</p>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-[#1f1f1f] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-[#1f1f1f] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-blue-400 hover:text-blue-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
