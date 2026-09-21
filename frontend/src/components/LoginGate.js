'use client';
import { useEffect, useState } from 'react';
import { KeyRound, Loader2, WifiOff } from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginGate({ children }) {
  const [status, setStatus] = useState('checking'); // checking | locked | unreachable | open
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const check = () => {
    api.getStats()
      .then(() => setStatus('open'))
      .catch(err => setStatus(err.message === 'Unauthorized' ? 'locked' : 'unreachable'));
  };

  useEffect(() => {
    check();
    const onUnauthorized = () => setStatus('locked');
    window.addEventListener('dashboard-unauthorized', onUnauthorized);
    return () => window.removeEventListener('dashboard-unauthorized', onUnauthorized);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    api.setKey(input.trim());
    try {
      await api.getStats();
      setStatus('open');
    } catch {
      api.setKey('');
      setError('Incorrect key');
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-gray-400 gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (status === 'unreachable') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 text-gray-500 gap-3 text-sm">
        <WifiOff className="w-6 h-6 text-gray-400" />
        Can&apos;t reach the backend at {api.apiUrl}.
        <button onClick={check} className="text-green-600 text-xs font-medium hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (status === 'open') return children;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-8 w-80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-gray-800 font-semibold">
          <KeyRound className="w-5 h-5" />
          Dashboard access
        </div>
        <p className="text-xs text-gray-400 -mt-2">Enter the dashboard key to continue.</p>
        <input
          type="password"
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Access key"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-400"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full bg-green-500 text-white text-sm font-medium py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
