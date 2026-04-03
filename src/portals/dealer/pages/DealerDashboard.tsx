import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Clock, TrendingUp, Wallet, Bell, ArrowRight, AlertCircle } from 'lucide-react';
import KPICard from '../../../components/ui/KPICard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { transactions, notifications, dealerVolumeLast7Days } from '../../../data/mockData';

const DealerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const myTx = transactions.filter(t => t.dealerId === 'D002').slice(0, 5);
  const myNotifs = notifications.slice(0, 3);

  return (
    <div className="p-6 space-y-5">
      {/* Welcome header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, Premier Exchange Co.</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Tier 1 Dealer</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">Status: Active</span>
            <span className="text-xs text-gray-400">License: FX-LIC-2019-002</span>
          </div>
        </div>
        <p className="text-sm text-gray-400">Friday, 15 March 2024</p>
      </div>

      {/* Active OMO Banner */}
      <div className="bg-blue-600 text-white rounded-xl p-4 flex items-center gap-4">
        <AlertCircle size={20} className="flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm">1 Active OMO Session — Submit your bid before 11:00 AM</p>
          <p className="text-white/70 text-xs mt-0.5">OMO-2024-003 · Injection · $2,000,000 pool · Fixed rate SL 565/USD</p>
        </div>
        <button onClick={() => navigate('/dealer-portal/omo-sessions')}
          className="flex items-center gap-1.5 bg-white text-blue-700 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-50 whitespace-nowrap">
          Submit Bid <ArrowRight size={14} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Today's Volume" value="$245,000" icon={DollarSign}
          iconColor="text-green-600" iconBg="bg-green-50" trend={{ value: '49% of daily limit', up: true }} />
        <KPICard title="Pending Allocations" value="$120,000" icon={Clock}
          iconColor="text-orange-600" iconBg="bg-orange-50" subtitle="OMO-2024-002 pending" />
        <KPICard title="My Rates" value="567 / 572" icon={TrendingUp}
          iconColor="text-blue-600" iconBg="bg-blue-50" subtitle="Buy / Sell (SL per USD)" />
        <KPICard title="Available Liquidity" value="$580,000" icon={Wallet}
          iconColor="text-purple-600" iconBg="bg-purple-50" subtitle="Zaad + e-Dahab" />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => navigate('/dealer-portal/omo-sessions')}
          className="flex items-center gap-2 bg-bos-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-bos-blue/90">
          Submit OMO Bid
        </button>
        <button onClick={() => navigate('/dealer-portal/my-rates')}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
          Update My Rates
        </button>
        <button onClick={() => navigate('/dealer-portal/transactions')}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
          View Transactions
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Volume Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">My Transaction Volume — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dealerVolumeLast7Days} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Bar dataKey="volume" fill="#1e40af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Latest Notifications</h2>
            <button onClick={() => navigate('/dealer-portal/notifications')} className="text-xs text-blue-600 hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {myNotifs.map(n => (
              <div key={n.id} className={`flex gap-3 p-3 rounded-lg ${!n.read ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                <Bell size={14} className={`flex-shrink-0 mt-0.5 ${!n.read ? 'text-blue-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`text-xs font-semibold ${!n.read ? 'text-blue-900' : 'text-gray-700'}`}>{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{n.timestamp.replace('T', ' ').slice(0, 16)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Recent Transactions</h2>
          <button onClick={() => navigate('/dealer-portal/transactions')} className="text-xs text-blue-600 hover:underline">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                {['Ref #', 'Type', 'Amount USD', 'Rate', 'Status', 'Time'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myTx.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-4 font-mono text-xs text-gray-500">{tx.refNumber.replace('FX-2024-', '')}</td>
                  <td className="py-2.5 pr-4"><StatusBadge status={tx.type} /></td>
                  <td className="py-2.5 pr-4 font-semibold">${tx.amountUSD.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-gray-600">SL {tx.rate.toLocaleString()}</td>
                  <td className="py-2.5 pr-4"><StatusBadge status={tx.status} /></td>
                  <td className="py-2.5 text-gray-400 text-xs">{tx.timestamp.split('T')[1].slice(0, 5)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DealerDashboard;
