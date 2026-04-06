import React, { useState } from 'react';
import { Banknote, Lock, User, Hash } from 'lucide-react';

const DealerLogin: React.FC = () => {
  const [dealerId, setDealerId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId || !username || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);

    // UI auth — any credentials grant portal access (prototype)
    // API auth is handled automatically by the API client using a service account (D002_admin)
    localStorage.setItem('dealer_logged_in', 'true');
    localStorage.setItem('dealer_id', dealerId);
    localStorage.setItem('dealer_username', username);

    window.location.replace('/dealer-portal/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-bos-blue flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-300/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white/10 border border-white/20 rounded-2xl p-4 mb-4">
            <Banknote size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">FX Dealer Portal</h1>
          <p className="text-white/60 text-sm mt-1">Bank of Somaliland — Licensed Dealers</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <p className="text-white/60 text-xs font-medium mb-5 flex items-center gap-2">
            <Lock size={12} />
            Authorized dealers only — Bank of Somaliland FX Platform
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white/70 text-xs font-medium mb-1.5 uppercase tracking-wide">Dealer ID</label>
              <div className="relative">
                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="text" value={dealerId} onChange={e => setDealerId(e.target.value)}
                  placeholder="e.g. D002"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-white/40" />
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-xs font-medium mb-1.5 uppercase tracking-wide">Username</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-white/40" />
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-xs font-medium mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-white/40" />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-white text-bos-blue font-bold py-2.5 rounded-lg text-sm hover:bg-white/90 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {loading
                ? <><div className="w-4 h-4 border-2 border-bos-blue/30 border-t-bos-blue rounded-full animate-spin" /> Signing in...</>
                : 'Sign In to Dealer Portal'}
            </button>
          </form>

          <div className="mt-5 p-3 bg-white/5 border border-white/10 rounded-lg text-xs text-white/40">
            <p className="font-medium text-white/60 mb-1">Demo Access</p>
            <p>Enter any Dealer ID, username and password to access the portal.</p>
            <p className="mt-1 text-white/30">You will be logged in as <span className="text-white/60">Premier Exchange Co. — Tier 1</span></p>
          </div>
        </div>

        <p className="text-white/20 text-xs text-center mt-6">Powered by hSenid Mobile Solutions</p>
      </div>
    </div>
  );
};

export default DealerLogin;
