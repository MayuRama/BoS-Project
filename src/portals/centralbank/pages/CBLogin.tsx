import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, User, ChevronDown, Shield } from 'lucide-react';

const CB_API = 'http://localhost:3001/api';

const CBLogin: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('FX Intervention Desk');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = ['FX Intervention Desk', 'Supervisor', 'Auditor'];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter username and password.');
      return;
    }
    setError('');
    setLoading(true);

    // Try real backend auth (best-effort — prototype always proceeds regardless)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${CB_API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('cb_username', data.user.username);
        localStorage.setItem('cb_fullName', data.user.fullName || '');
      } else {
        localStorage.removeItem('accessToken');
      }
    } catch {
      // Backend unavailable or timed out — continue with mock login
      localStorage.removeItem('accessToken');
    }

    // Always proceed (prototype behaviour — any credentials work)
    localStorage.setItem('cb_logged_in', 'true');
    localStorage.setItem('cb_role', role);
    window.location.replace('/centralbank-portal/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bos-navy via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-bos-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-bos-green/10 border border-bos-green/30 rounded-2xl p-4 mb-4">
            <Building2 size={36} className="text-bos-green" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bank of Somaliland</h1>
          <p className="text-white/60 text-sm mt-1">National FX Intervention Platform</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={16} className="text-bos-green" />
            <p className="text-white/70 text-sm font-medium">Secure Central Bank Portal Login</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-white/70 text-xs font-medium mb-1.5 uppercase tracking-wide">Access Role</label>
              <div className="relative">
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-bos-green/50 focus:bg-white/15">
                  {roles.map(r => <option key={r} value={r} className="bg-slate-800">{r}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-xs font-medium mb-1.5 uppercase tracking-wide">Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-bos-green/50 focus:bg-white/15" />
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-xs font-medium mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-bos-green/50 focus:bg-white/15" />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-bos-green hover:bg-bos-green/90 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authenticating...</>
              ) : 'Sign In to Portal'}
            </button>
          </form>

          <div className="mt-5 p-3 bg-white/5 border border-white/10 rounded-lg text-xs text-white/40">
            <p className="font-medium text-white/60 mb-1">Demo Access</p>
            <p>Enter any username and password to log in.</p>
            <p className="mt-1">For full API access use: <span className="text-white/60">fxdesk / admin123</span></p>
          </div>

          <p className="text-white/30 text-xs text-center mt-6">Restricted access — authorized personnel only</p>
        </div>

        <p className="text-white/20 text-xs text-center mt-6">Powered by hSenid Mobile Solutions</p>
      </div>
    </div>
  );
};

export default CBLogin;
