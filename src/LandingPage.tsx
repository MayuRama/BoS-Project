import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Banknote, ArrowRight, Shield, TrendingUp, Globe } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-bos-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-bos-blue/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-bos-green/10 border border-bos-green/30 rounded-xl p-2">
            <Building2 size={24} className="text-bos-green" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Bank of Somaliland</p>
            <p className="text-white/40 text-xs">Central Banking Authority</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-white/30" />
          <span className="text-white/30 text-xs">Hargeisa, Somaliland</span>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center py-16">
        <div className="mb-3">
          <span className="text-bos-green text-xs font-semibold uppercase tracking-widest px-3 py-1 bg-bos-green/10 border border-bos-green/20 rounded-full">
            v2.4.1 — Production
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white mt-4 max-w-3xl leading-tight">
          National FX Platform
          <br />
          <span className="text-bos-green">Bank of Somaliland</span>
        </h1>
        <p className="text-white/50 text-lg mt-4 max-w-xl">
          The official foreign exchange management platform for the National Bank and licensed FX dealers.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {[
            { icon: TrendingUp, label: 'OMO Sessions' },
            { icon: Shield, label: 'AML Monitoring' },
            { icon: Banknote, label: 'FX Rate Controls' },
            { icon: Globe, label: 'USSD Integration' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-white/60 text-sm">
              <Icon size={14} />
              {label}
            </div>
          ))}
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-14 w-full max-w-2xl">
          {/* Central Bank Portal */}
          <div
            onClick={() => navigate('/centralbank-portal/login')}
            className="group bg-white/5 hover:bg-bos-green/10 border border-white/10 hover:border-bos-green/40 rounded-2xl p-7 cursor-pointer transition-all duration-300 text-left"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="bg-bos-green/10 border border-bos-green/30 rounded-xl p-3">
                <Building2 size={28} className="text-bos-green" />
              </div>
              <ArrowRight size={18} className="text-white/20 group-hover:text-bos-green group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="text-white font-bold text-xl">Central Bank Portal</h2>
            <p className="text-white/50 text-sm mt-2 leading-relaxed">
              For regulators and administrators. Manage OMO sessions, dealer oversight, rate controls, AML monitoring and comprehensive reporting.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['FX Intervention Desk', 'Supervisor', 'Auditor'].map(r => (
                <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-bos-green/10 text-bos-green/80 border border-bos-green/20">{r}</span>
              ))}
            </div>
          </div>

          {/* Dealer Portal */}
          <div
            onClick={() => navigate('/dealer-portal/login')}
            className="group bg-white/5 hover:bg-blue-600/10 border border-white/10 hover:border-blue-500/40 rounded-2xl p-7 cursor-pointer transition-all duration-300 text-left"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                <Banknote size={28} className="text-blue-400" />
              </div>
              <ArrowRight size={18} className="text-white/20 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="text-white font-bold text-xl">Dealer Portal</h2>
            <p className="text-white/50 text-sm mt-2 leading-relaxed">
              For licensed FX dealers. Submit OMO bids, manage exchange rates, view transactions and track allocation results.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['Tier 1 Dealers', 'Tier 2 Dealers'].map(r => (
                <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400/80 border border-blue-500/20">{r}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-14 flex flex-wrap justify-center gap-8">
          {[
            { label: 'Licensed Dealers', value: '15' },
            { label: 'Daily Volume', value: '$4.28M' },
            { label: 'Uptime', value: '99.9%' },
            { label: 'USSD Transactions/day', value: '2,800+' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-white/40 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-5 px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-white/20 text-xs">
          © 2024 Bank of Somaliland. All rights reserved.
        </p>
        <p className="text-white/20 text-xs flex items-center gap-2">
          Powered by{' '}
          <span className="text-white/40 font-semibold">hSenid Mobile</span>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
