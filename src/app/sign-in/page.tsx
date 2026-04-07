'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#141414] border border-[#2a2a2a] rounded-xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-gray-400 mb-8 text-sm">Sign in to your account</p>
        <form onSubmit={handleSignIn} className="space-y-4">
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-gray-400 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-blue-400 hover:text-blue-300">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
