import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  DollarSign, Activity, Users, AlertTriangle, TrendingUp, Smartphone, Wifi,
} from 'lucide-react';
import KPICard from '../../../components/ui/KPICard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { api } from '../../../api/client';

const PIE_COLORS = ['#6ab04c', '#1e40af'];

const fmtUSD = (n: number) => `$${n.toLocaleString()}`;

// ── Inline Types ──────────────────────────────────────────────────────────────

interface DashboardKPIs {
  totalVolumeToday: number;
  telesomVolumeToday: number;
  somtelVolumeToday: number;
  zaadSettlements: number;
  edahabSettlements: number;
  activeOMOSessions: number;
  activeDealers: number;
  pendingAMLAlerts: number;
  totalTxToday: number;
  telesomTxCount: number;
  somtelTxCount: number;
  telesomPct: number;
  somtelPct: number;
}

interface DashboardStats {
  kpis: DashboardKPIs;
  volumeLast7Days: { day: string; telesom: number; somtel: number; total: number }[];
  transactionTypeSplit: { name: string; value: number }[];
  telcoSplit: { name: string; value: number }[];
  topDealers: { name: string; volume: number }[];
  recentTransactions: {
    id: string; refNumber: string; type: string; mobileNumber: string;
    telcoOperator: string; amountUSD: number; amountSL: number; rate: number;
    dealerName: string; status: string; timestamp: string;
  }[];
  activeSessions: {
    id: string; type: string; fixedRate: number; totalAmount: number;
    status: string; bidsCount: number; totalBidAmount: number;
    startTime: string; durationMinutes: number;
  }[];
}

// ── Component ─────────────────────────────────────────────────────────────────

const CBDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get<DashboardStats>('/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error('Dashboard stats fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-bos-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const kpis = stats?.kpis;
  const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="p-6 space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Real-time FX market overview — {today}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total FX Volume Today"
          value={kpis ? fmtUSD(kpis.totalVolumeToday) : '—'}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          subtitle={kpis ? `${kpis.totalTxToday} transactions today` : undefined}
        />
        <KPICard
          title="Active OMO Sessions"
          value={kpis ? String(kpis.activeOMOSessions) : '—'}
          icon={Activity}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          subtitle={kpis ? `${kpis.activeOMOSessions} Open` : undefined}
        />
        <KPICard
          title="Active Dealers"
          value={kpis ? String(kpis.activeDealers) : '—'}
          icon={Users}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          subtitle="Licensed FX dealers"
        />
        <KPICard
          title="Pending AML Alerts"
          value={kpis ? String(kpis.pendingAMLAlerts) : '—'}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
          subtitle="New + Under Review"
        />
      </div>

      {/* Telco / Wallet KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Telesom (Zaad) Volume"
          value={kpis ? fmtUSD(kpis.telesomVolumeToday) : '—'}
          icon={Smartphone}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          subtitle={kpis ? `${kpis.telesomPct}% of total · ${kpis.telesomTxCount} txns` : undefined}
        />
        <KPICard
          title="Somtel (e-Dahab) Volume"
          value={kpis ? fmtUSD(kpis.somtelVolumeToday) : '—'}
          icon={Wifi}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          subtitle={kpis ? `${kpis.somtelPct}% of total · ${kpis.somtelTxCount} txns` : undefined}
        />
        <KPICard
          title="Zaad Settlements"
          value={kpis ? String(kpis.zaadSettlements) : '—'}
          icon={Smartphone}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          subtitle="Today"
        />
        <KPICard
          title="e-Dahab Settlements"
          value={kpis ? String(kpis.edahabSettlements) : '—'}
          icon={Wifi}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          subtitle="Today"
        />
      </div>

      {/* Rate Banner */}
      <div className="bg-bos-navy text-white rounded-xl p-4 flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-bos-green" />
          <span className="text-white/60 text-sm">Current USD/SL Rate:</span>
          <span className="font-bold text-lg">SL 572</span>
        </div>
        <div className="w-px h-6 bg-white/20 hidden sm:block" />
        <div>
          <span className="text-white/60 text-sm">Market Reference: </span>
          <span className="font-semibold">SL 570</span>
        </div>
        <div className="w-px h-6 bg-white/20 hidden sm:block" />
        <div>
          <span className="text-white/60 text-sm">Spread: </span>
          <span className="font-semibold text-bos-green">0.88%</span>
        </div>
        <div className="w-px h-6 bg-white/20 hidden sm:block" />
        <div>
          <span className="text-white/60 text-sm">CB Limits: </span>
          <span className="font-semibold">SL 558 – SL 580</span>
        </div>
        <div className="w-px h-6 bg-white/20 hidden sm:block" />
        <div>
          <span className="text-white/60 text-sm">Status: </span>
          <span className="font-semibold text-bos-green">Within Limits</span>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart — last 7 days by telco */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Transaction Volume — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats?.volumeLast7Days ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={d => d.split(' ')[0]} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => fmtUSD(v)} />
              <Legend />
              <Line type="monotone" dataKey="telesom" name="Telesom" stroke="#6ab04c" strokeWidth={2} dot={{ r: 3, fill: '#6ab04c' }} />
              <Line type="monotone" dataKey="somtel" name="Somtel" stroke="#1e40af" strokeWidth={2} dot={{ r: 3, fill: '#1e40af' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Transaction Type Split</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats?.transactionTypeSplit ?? []}
                cx="50%" cy="50%" outerRadius={70}
                dataKey="value"
                label={({ name, value }: { name: string; value: number }) => `${name} ${value}%`}
                labelLine={false}
              >
                {(stats?.transactionTypeSplit ?? []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip formatter={(v: number) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dealer Activity bar chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Top 5 Dealers by Volume (30 days)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats?.topDealers ?? []} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: number) => fmtUSD(v)} />
            <Bar dataKey="volume" fill="#1e40af" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Ref #', 'Type', 'Mobile', 'Telco', 'USD', 'Rate', 'Dealer', 'Status', 'Time'].map(h => (
                    <th key={h} className="text-left text-gray-400 font-medium pb-2 pr-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(stats?.recentTransactions ?? []).map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="py-2 pr-3 font-mono text-gray-600">{tx.refNumber.replace(/FX-\d{8}-/, '')}</td>
                    <td className="py-2 pr-3"><StatusBadge status={tx.type} /></td>
                    <td className="py-2 pr-3 font-mono font-semibold text-gray-800">{tx.mobileNumber}</td>
                    <td className="py-2 pr-3">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        tx.telcoOperator === 'Telesom' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>{tx.telcoOperator}</span>
                    </td>
                    <td className="py-2 pr-3 font-medium">{fmtUSD(tx.amountUSD)}</td>
                    <td className="py-2 pr-3 text-gray-600">SL {tx.rate}</td>
                    <td className="py-2 pr-3 text-gray-700 truncate max-w-20">{tx.dealerName.split(' ')[0]}</td>
                    <td className="py-2 pr-3"><StatusBadge status={tx.status} /></td>
                    <td className="py-2 text-gray-400">{tx.timestamp.split('T')[1].slice(0, 5)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(stats?.recentTransactions ?? []).length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No transactions</p>
          )}
        </div>

        {/* Active OMO Sessions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Active OMO Sessions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Session ID', 'Type', 'Rate', 'Total', 'Bids', 'Status'].map(h => (
                    <th key={h} className="text-left text-gray-400 font-medium pb-2 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(stats?.activeSessions ?? []).map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-3 font-mono text-blue-600 font-medium">{s.id}</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={s.type} /></td>
                    <td className="py-2.5 pr-3">SL {s.fixedRate.toLocaleString()}</td>
                    <td className="py-2.5 pr-3">{fmtUSD(s.totalAmount)}</td>
                    <td className="py-2.5 pr-3">{s.bidsCount} ({fmtUSD(s.totalBidAmount)})</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(stats?.activeSessions ?? []).length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No active sessions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CBDashboard;
