'use client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-gray-400 hover:text-white transition-colors"
    >
      Sign out
    </button>
  );
}
