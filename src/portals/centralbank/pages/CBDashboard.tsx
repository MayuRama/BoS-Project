import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  DollarSign, Activity, Users, AlertTriangle, TrendingUp, Smartphone, Wifi,
} from 'lucide-react';
import KPICard from '../../../components/ui/KPICard';
import StatusBadge from '../../../components/ui/StatusBadge';
import {
  transactions, volumeLast7Days, dealerActivity, transactionTypeSplit, omoSessions, telcoSplit,
} from '../../../data/mockData';

const PIE_COLORS = ['#6ab04c', '#1e40af'];

const fmtUSD = (n: number) => `$${n.toLocaleString()}`;

const telesomVolume = transactions.filter(t => t.telcoOperator === 'Telesom').reduce((s, t) => s + t.amountUSD, 0);
const somtelVolume  = transactions.filter(t => t.telcoOperator === 'Somtel').reduce((s, t) => s + t.amountUSD, 0);

const CBDashboard: React.FC = () => {
  const activeSessions = omoSessions.filter(s => s.status === 'Open' || s.status === 'Pending Allocation');
  const recentTx = transactions.slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Real-time FX market overview — 15 March 2024</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total FX Volume Today" value="$4,280,000" icon={DollarSign}
          iconColor="text-green-600" iconBg="bg-green-50" trend={{ value: '+8.2% vs yesterday', up: true }} />
        <KPICard title="Active OMO Sessions" value="2" icon={Activity}
          iconColor="text-blue-600" iconBg="bg-blue-50" subtitle="1 Open · 1 Pending Allocation" />
        <KPICard title="Active Dealers" value="14" icon={Users}
          iconColor="text-purple-600" iconBg="bg-purple-50" subtitle="5 Tier 1 · 9 Tier 2" />
        <KPICard title="Pending AML Alerts" value="3" icon={AlertTriangle}
          iconColor="text-red-600" iconBg="bg-red-50" trend={{ value: '+1 since yesterday', up: false }} />
      </div>

      {/* Telco / Wallet KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Telesom (Zaad) Volume" value={fmtUSD(telesomVolume)} icon={Smartphone}
          iconColor="text-emerald-600" iconBg="bg-emerald-50"
          subtitle={`${telcoSplit[0].value}% of total · ${transactions.filter(t => t.telcoOperator === 'Telesom').length} txns`} />
        <KPICard title="Somtel (e-Dahab) Volume" value={fmtUSD(somtelVolume)} icon={Wifi}
          iconColor="text-blue-600" iconBg="bg-blue-50"
          subtitle={`${telcoSplit[1].value}% of total · ${transactions.filter(t => t.telcoOperator === 'Somtel').length} txns`} />
        <KPICard title="Zaad Settlements" value="312" icon={Smartphone}
          iconColor="text-green-600" iconBg="bg-green-50" subtitle="8 failed · 12 pending" />
        <KPICard title="e-Dahab Settlements" value="238" icon={Wifi}
          iconColor="text-purple-600" iconBg="bg-purple-50" subtitle="6 failed · 9 pending" />
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
        {/* Line chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Transaction Volume — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={volumeLast7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={d => d.split(' ')[0]} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => fmtUSD(v)} />
              <Line type="monotone" dataKey="volume" stroke="#6ab04c" strokeWidth={2} dot={{ r: 4, fill: '#6ab04c' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Transaction Type Split</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={transactionTypeSplit} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                {transactionTypeSplit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip formatter={(v: number) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dealer Activity bar chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Top 5 Dealers by Volume</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dealerActivity} barSize={36}>
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
                {recentTx.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="py-2 pr-3 font-mono text-gray-600">{tx.refNumber.replace('FX-2024-', '')}</td>
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
                {activeSessions.map(s => {
                  const totalBids = s.bids.reduce((a, b) => a + b.bidAmount, 0);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-3 font-mono text-blue-600 font-medium">{s.id}</td>
                      <td className="py-2.5 pr-3"><StatusBadge status={s.type} /></td>
                      <td className="py-2.5 pr-3">SL {s.fixedRate.toLocaleString()}</td>
                      <td className="py-2.5 pr-3">{fmtUSD(s.totalAmount)}</td>
                      <td className="py-2.5 pr-3">{s.bids.length} ({fmtUSD(totalBids)})</td>
                      <td className="py-2.5 pr-3"><StatusBadge status={s.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {activeSessions.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No active sessions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CBDashboard;
