import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Clock, TrendingUp, Wallet, Bell, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import KPICard from '../../../components/ui/KPICard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { api } from '../../../api/client';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DealerInfo {
  id: string; name: string; tier: string; status: string;
  licenseNumber: string; buyRate: number; sellRate: number; dailyLimit: number;
  walletProvider: string;
  zaadWallet: string | null; zaadBalanceUSD: number;
  eDahabWallet: string | null; eDahabBalanceUSD: number;
}

interface DealerKPIs {
  todayVolumeUSD: number;
  todayTxCount: number;
  pendingAllocationAmount: number;
  pendingAllocationCount: number;
  availableLiquidityTotal: number;
  availableLiquidityZaad: number;
  availableLiquidityEDahab: number;
  openOMOSessions: number;
  dailyLimitUsedPct: number;
}

interface VolumeDay { day: string; volume: number; }

interface RecentTx {
  id: string; refNumber: string; type: string;
  amountUSD: number; rate: number; status: string; timestamp: string;
}

interface OpenBid {
  id: string; sessionId: string; bidAmount: number;
  bidRate: number | null; status: string; submittedAt: string;
  session?: { id: string; type: string; status: string };
}

interface DealerNotification {
  id: string; type: string; title: string; message: string; read: boolean; createdAt: string;
}

interface DealerStats {
  dealer: DealerInfo;
  kpis: DealerKPIs;
  volumeLast7Days: VolumeDay[];
  recentTransactions: RecentTx[];
  myOpenBids: OpenBid[];
  notifications: DealerNotification[];
}

const fmtUSD = (n: number) => `$${Math.round(n).toLocaleString()}`;

// ─── Component ───────────────────────────────────────────────────────────────

const DealerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DealerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get<DealerStats>('/dashboard/dealer-stats');
      setStats(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-gray-400 text-sm">
        <RefreshCw size={16} className="animate-spin" /> Loading dashboard...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error || 'Failed to load dashboard data. Make sure the backend is running.'}
        </div>
      </div>
    );
  }

  const { dealer, kpis, volumeLast7Days, recentTransactions, myOpenBids, notifications } = stats;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="p-6 space-y-5">
      {/* Welcome header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {dealer.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {dealer.tier === 'Tier1' ? 'Tier 1' : 'Tier 2'} Dealer
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${dealer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Status: {dealer.status}
            </span>
            <span className="text-xs text-gray-400">License: {dealer.licenseNumber}</span>
          </div>
        </div>
        <p className="text-sm text-gray-400">{today}</p>
      </div>

      {/* Active OMO Banner */}
      {kpis.openOMOSessions > 0 && (
        <div className="bg-blue-600 text-white rounded-xl p-4 flex items-center gap-4">
          <AlertCircle size={20} className="flex-shrink-0" />
          <div className="flex-1">
            {myOpenBids.length > 0 ? (
              <>
                <p className="font-semibold text-sm">
                  {kpis.openOMOSessions} Active OMO Session{kpis.openOMOSessions > 1 ? 's' : ''} — You have {myOpenBids.length} bid{myOpenBids.length > 1 ? 's' : ''} submitted
                </p>
                <p className="text-white/70 text-xs mt-0.5">You can edit or cancel your bid until the session closes.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-sm">
                  {kpis.openOMOSessions} Active OMO Session{kpis.openOMOSessions > 1 ? 's' : ''} — Submit your bid now
                </p>
                <p className="text-white/70 text-xs mt-0.5">Open sessions are accepting bids.</p>
              </>
            )}
          </div>
          <button
            onClick={() => navigate('/dealer-portal/omo-sessions')}
            className="flex items-center gap-1.5 bg-white text-blue-700 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-50 whitespace-nowrap">
            {myOpenBids.length > 0 ? 'Manage Bid' : 'Submit Bid'} <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Today's Volume"
          value={fmtUSD(kpis.todayVolumeUSD)}
          icon={DollarSign}
          iconColor="text-green-600" iconBg="bg-green-50"
          trend={{ value: `${kpis.dailyLimitUsedPct}% of daily limit`, up: kpis.dailyLimitUsedPct < 80 }}
        />
        <KPICard
          title="Pending Allocations"
          value={fmtUSD(kpis.pendingAllocationAmount)}
          icon={Clock}
          iconColor="text-orange-600" iconBg="bg-orange-50"
          subtitle={
            kpis.pendingAllocationCount > 0
              ? `${kpis.pendingAllocationCount} allocation${kpis.pendingAllocationCount > 1 ? 's' : ''} awaiting settlement`
              : 'No pending allocations'
          }
        />
        <KPICard
          title="My Rates"
          value={`${dealer.buyRate} / ${dealer.sellRate}`}
          icon={TrendingUp}
          iconColor="text-blue-600" iconBg="bg-blue-50"
          subtitle="Buy / Sell (SL per USD)"
        />
        <KPICard
          title="Wallet Balance"
          value={fmtUSD(kpis.availableLiquidityTotal)}
          icon={Wallet}
          iconColor="text-purple-600" iconBg="bg-purple-50"
          subtitle={`Zaad: ${fmtUSD(kpis.availableLiquidityZaad)} · e-Dahab: ${fmtUSD(kpis.availableLiquidityEDahab)}`}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate('/dealer-portal/omo-sessions')}
          className="flex items-center gap-2 bg-bos-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-bos-blue/90">
          {myOpenBids.length > 0 ? 'Manage OMO Bid' : 'Submit OMO Bid'}
        </button>
        <button
          onClick={() => navigate('/dealer-portal/my-rates')}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
          Update My Rates
        </button>
        <button
          onClick={() => navigate('/dealer-portal/transactions')}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
          View Transactions
        </button>
      </div>

      {/* Wallet Balances */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Wallet Balances (USD)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dealer.walletProvider !== 'eDahab' && (
            <div className="bg-white rounded-xl border border-green-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                    <Wallet size={16} className="text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Zaad Wallet</p>
                    <p className="text-xs text-gray-400">Telesom Network</p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Zaad</span>
              </div>
              <p className="text-xs text-gray-400 font-mono mb-2">{dealer.zaadWallet ?? '—'}</p>
              <p className="text-2xl font-bold text-gray-900">{fmtUSD(kpis.availableLiquidityZaad)}</p>
              <p className="text-xs text-gray-400 mt-1">Available USD balance</p>
            </div>
          )}
          {dealer.walletProvider !== 'Zaad' && (
            <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Wallet size={16} className="text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">e-Dahab Wallet</p>
                    <p className="text-xs text-gray-400">Somtel Network</p>
                  </div>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">e-Dahab</span>
              </div>
              <p className="text-xs text-gray-400 font-mono mb-2">{dealer.eDahabWallet ?? '—'}</p>
              <p className="text-2xl font-bold text-gray-900">{fmtUSD(kpis.availableLiquidityEDahab)}</p>
              <p className="text-xs text-gray-400 mt-1">Available USD balance</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Volume Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">My Transaction Volume — Last 7 Days</h2>
          {volumeLast7Days.every(d => d.volume === 0) ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No transaction data for this period.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeLast7Days} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Volume']} />
                <Bar dataKey="volume" fill="#1e40af" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Latest Notifications</h2>
            <button onClick={() => navigate('/dealer-portal/notifications')} className="text-xs text-blue-600 hover:underline">View all</button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No notifications yet.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className={`flex gap-3 p-3 rounded-lg ${!n.read ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                  <Bell size={14} className={`flex-shrink-0 mt-0.5 ${!n.read ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-xs font-semibold ${!n.read ? 'text-blue-900' : 'text-gray-700'}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.createdAt.replace('T', ' ').slice(0, 16)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Recent Transactions</h2>
          <button onClick={() => navigate('/dealer-portal/transactions')} className="text-xs text-blue-600 hover:underline">View all</button>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Ref #', 'Type', 'Amount (USD)', 'Rate', 'Status', 'Time'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-mono text-xs text-gray-500">{tx.refNumber}</td>
                    <td className="py-2.5 pr-4"><StatusBadge status={tx.type} /></td>
                    <td className="py-2.5 pr-4 font-semibold">${tx.amountUSD.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-gray-600">SL {tx.rate.toLocaleString()}</td>
                    <td className="py-2.5 pr-4"><StatusBadge status={tx.status} /></td>
                    <td className="py-2.5 text-gray-400 text-xs">{tx.timestamp.slice(11, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerDashboard;
