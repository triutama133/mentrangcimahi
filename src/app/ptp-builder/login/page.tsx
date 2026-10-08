'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ShieldAlert } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const unconfigured = params.get('unconfigured') === '1';
  const nextPath = params.get('next') || '/ptp-builder';

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/ptp-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Gagal masuk.');
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100">PTP Builder</h1>
            <p className="text-[11px] text-slate-500">Akses terbatas &mdash; khusus internal</p>
          </div>
        </div>

        {unconfigured && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-950/60 border border-amber-800 text-[11px] text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Server belum mengatur PTP_BUILDER_PASSWORD. Atur variabel lingkungan ini terlebih dahulu.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full bg-slate-950 text-slate-100 text-sm rounded-xl p-2.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {error && <p className="text-[11px] text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Memeriksa...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PtpLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
