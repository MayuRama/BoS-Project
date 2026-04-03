import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';
import { Download, FileText, Smartphone, Wifi } from 'lucide-react';
import KPICard from '../../../components/ui/KPICard';
import { DollarSign, Activity, Users, TrendingUp } from 'lucide-react';
import {
  dealers, transactions, volumeLast7Days,
  telcoVolumeData, telcoTxCountData, telcoSplit, walletSettlementData, walletAvgTxData,
} from '../../../data/mockData';

type ReportTab = 'Transaction Summary' | 'Dealer Performance' | 'Liquidity Analytics' | 'OMO Results' | 'Telco Analytics' | 'Wallet Analytics';

const TELCO_COLORS = ['#6ab04c', '#1e40af'];

const liquidityData = [
  { date: 'Mar 9',  inflow: 2100000, outflow: 1720000 },
  { date: 'Mar 10', inflow: 2450000, outflow: 1700000 },
  { date: 'Mar 11', inflow: 1900000, outflow: 1750000 },
  { date: 'Mar 12', inflow: 2800000, outflow: 2020000 },
  { date: 'Mar 13', inflow: 3200000, outflow: 2000000 },
  { date: 'Mar 14', inflow: 2300000, outflow: 1600000 },
  { date: 'Mar 15', inflow: 2600000, outflow: 1680000 },
];

const omoResultsData = [
  { session: 'OMO-2023-015', allocated:  630000, bids:  630000 },
  { session: 'OMO-2023-016', allocated: 1030000, bids: 1030000 },
  { session: 'OMO-2023-018', allocated: 1400000, bids: 1400000 },
  { session: 'OMO-2024-001', allocated: 2400000, bids: 2400000 },
  { session: 'OMO-2024-002', allocated:       0, bids: 1300000 },
];

const Reports: React.FC = () => {
  const [tab, setTab] = useState<ReportTab>('Transaction Summary');
  const [dateFrom, setDateFrom] = useState('2024-03-01');
  const [dateTo, setDateTo] = useState('2024-03-15');

  const topDealers = [...dealers]
    .filter(d => d.status === 'Active')
    .sort((a, b) => b.volume30d - a.volume30d)
    .slice(0, 8);

  const dealerChartData = topDealers.slice(0, 6).map(d => ({
    name: d.name.split(' ')[0],
    volume: d.volume30d,
    txCount: d.txCount30d,
  }));

  const avgRate = Math.round(transactions.reduce((a, t) => a + t.rate, 0) / transactions.length);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Comprehensive FX market reporting</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Download size={14} /> Export CSV
          </button>
          <button className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50">
            <FileText size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* Date range */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-xl p-3">
        <span className="text-sm text-gray-500 font-medium">Date Range:</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/20" />
        <span className="text-gray-400">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/20" />
        <button className="bg-bos-green text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-bos-green/90">Apply</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
        {(['Transaction Summary', 'Dealer Performance', 'Liquidity Analytics', 'OMO Results', 'Telco Analytics', 'Wallet Analytics'] as ReportTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Transaction Summary */}
      {tab === 'Transaction Summary' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard title="Total Volume" value="$29.4M" icon={DollarSign} iconColor="text-green-600" iconBg="bg-green-50" />
            <KPICard title="Total Transactions" value="284" icon={Activity} iconColor="text-blue-600" iconBg="bg-blue-50" />
            <KPICard title="Average Rate" value={`SL ${avgRate.toLocaleString()}`} icon={TrendingUp} iconColor="text-purple-600" iconBg="bg-purple-50" />
            <KPICard title="Unique Customers" value="1,842" icon={Users} iconColor="text-orange-600" iconBg="bg-orange-50" />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Transaction Volume Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={volumeLast7Days}>
                <defs>
                  <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ab04c" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6ab04c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={d => d.split(' ')[0]} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="volume" stroke="#6ab04c" fill="url(#volGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Top Dealers by Volume</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Dealer', 'Tier', 'Volume (30d)', 'Tx Count', 'Avg Rate', 'Compliance'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topDealers.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{d.name}</td>
                    <td className="px-4 py-2.5"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.tier === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>Tier {d.tier}</span></td>
                    <td className="px-4 py-2.5 font-semibold">${d.volume30d.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-600">{d.txCount30d}</td>
                    <td className="px-4 py-2.5 text-gray-600">SL {((d.buyRate + d.sellRate) / 2).toFixed(0)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-bos-green rounded-full" style={{ width: `${d.complianceScore}%` }} /></div>
                        <span className="text-xs text-gray-500">{d.complianceScore}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dealer Performance */}
      {tab === 'Dealer Performance' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Volume Comparison (Top 6 Dealers)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dealerChartData} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="volume" fill="#1e40af" name="Volume (30d)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Dealer Performance Table</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Dealer', 'Volume', 'Tx Count', 'Avg Rate', 'Compliance Score', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dealers.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{d.name}</td>
                    <td className="px-4 py-2.5 font-semibold">${d.volume30d.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-600">{d.txCount30d}</td>
                    <td className="px-4 py-2.5 text-gray-600">SL {((d.buyRate + d.sellRate) / 2).toFixed(0)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full"><div className={`h-full rounded-full ${d.complianceScore >= 90 ? 'bg-green-500' : d.complianceScore >= 75 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${d.complianceScore}%` }} /></div>
                        <span className="text-xs text-gray-600 font-medium">{d.complianceScore}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.status === 'Active' ? 'bg-green-100 text-green-800' : d.status === 'Suspended' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Liquidity Analytics */}
      {tab === 'Liquidity Analytics' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">USD Inflow vs Outflow (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={liquidityData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="inflow" fill="#6ab04c" name="USD Inflow" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" fill="#1e40af" name="USD Outflow" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Inflow (7d)', value: '$17.35M', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
              { label: 'Total Outflow (7d)', value: '$12.47M', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
              { label: 'Net Position', value: '+$4.88M', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
            ].map(c => (
              <div key={c.label} className={`rounded-xl border ${c.bg} p-4`}>
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color} mt-1`}>{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OMO Results */}
      {tab === 'OMO Results' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">OMO Session Results — Bids vs Allocated</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={omoResultsData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="session" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="bids" fill="#94a3b8" name="Total Bids" radius={[4, 4, 0, 0]} />
                <Bar dataKey="allocated" fill="#6ab04c" name="Allocated" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Telco Analytics */}
      {tab === 'Telco Analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard title="Telesom Volume (7d)" value="$19.16M" icon={Smartphone}
              iconColor="text-emerald-600" iconBg="bg-emerald-50"
              subtitle="57% of total · 313 txns" />
            <KPICard title="Somtel Volume (7d)" value="$14.66M" icon={Wifi}
              iconColor="text-blue-600" iconBg="bg-blue-50"
              subtitle="43% of total · 225 txns" />
            <KPICard title="Telesom Avg Tx Size" value="$2,980" icon={Smartphone}
              iconColor="text-green-600" iconBg="bg-green-50" />
            <KPICard title="Somtel Avg Tx Size" value="$2,540" icon={Wifi}
              iconColor="text-purple-600" iconBg="bg-purple-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Volume by Telco — Last 7 Days (USD)</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={telcoVolumeData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="telesom" fill="#6ab04c" name="Telesom (Zaad)"   radius={[3,3,0,0]} />
                  <Bar dataKey="somtel"  fill="#1e40af" name="Somtel (e-Dahab)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Telco Share</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={telcoSplit} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                    label={({ value }) => `${value}%`} labelLine={false}>
                    {telcoSplit.map((_, i) => <Cell key={i} fill={TELCO_COLORS[i]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Transaction Count by Telco — Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={telcoTxCountData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="telesom" fill="#6ab04c" name="Telesom" radius={[3,3,0,0]} />
                <Bar dataKey="somtel"  fill="#1e40af" name="Somtel"  radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Telco Breakdown Summary</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Telco', 'Wallet', 'Volume (7d)', 'Txn Count', 'Avg Tx Size', 'Market Share', 'Trend'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { telco: 'Telesom', wallet: 'Zaad',    volume: 19160000, count: 313, avg: 2980, share: 57, trend: '+4.2%', color: 'emerald' },
                  { telco: 'Somtel',  wallet: 'e-Dahab', volume: 14660000, count: 225, avg: 2540, share: 43, trend: '+2.8%', color: 'blue' },
                ].map(row => (
                  <tr key={row.telco} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`font-semibold text-${row.color}-700`}>{row.telco}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.wallet}</td>
                    <td className="px-4 py-3 font-semibold">${row.volume.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{row.count}</td>
                    <td className="px-4 py-3 text-gray-600">${row.avg.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div className="h-full bg-bos-green rounded-full" style={{ width: `${row.share}%` }} />
                        </div>
                        <span className="text-xs text-gray-600">{row.share}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-green-600 font-medium text-sm">{row.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Wallet Analytics */}
      {tab === 'Wallet Analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard title="Zaad Transactions" value="312" icon={Smartphone}
              iconColor="text-green-600" iconBg="bg-green-50" subtitle="96.3% success rate" />
            <KPICard title="e-Dahab Transactions" value="238" icon={Wifi}
              iconColor="text-purple-600" iconBg="bg-purple-50" subtitle="97.5% success rate" />
            <KPICard title="Zaad Settlement Failures" value="8" icon={Smartphone}
              iconColor="text-red-600" iconBg="bg-red-50" subtitle="2.5% failure rate" />
            <KPICard title="e-Dahab Settlement Failures" value="6" icon={Wifi}
              iconColor="text-orange-600" iconBg="bg-orange-50" subtitle="2.5% failure rate" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Average Transaction Size by Wallet — Last 7 Days (USD)</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={walletAvgTxData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v.toLocaleString()}`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="zaad"   stroke="#6ab04c" strokeWidth={2} name="Zaad"    dot={{ r: 4, fill: '#6ab04c' }} />
                <Line type="monotone" dataKey="edahab" stroke="#8b5cf6" strokeWidth={2} name="e-Dahab" dot={{ r: 4, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Settlement Status by Wallet</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Wallet', 'Successful', 'Failed', 'Pending', 'Total', 'Success Rate'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {walletSettlementData.map(row => {
                  const total = row.success + row.failed + row.pending;
                  const rate = ((row.success / total) * 100).toFixed(1);
                  return (
                    <tr key={row.wallet} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-800">{row.wallet}</td>
                      <td className="px-4 py-3 text-green-700 font-semibold">{row.success}</td>
                      <td className="px-4 py-3 text-red-600">{row.failed}</td>
                      <td className="px-4 py-3 text-yellow-600">{row.pending}</td>
                      <td className="px-4 py-3 text-gray-700">{total}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-700">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Wallet Usage by Dealer (Top 8)</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Dealer', 'Tier', 'Zaad Volume', 'e-Dahab Volume', 'Primary Wallet'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dealers.filter(d => d.status === 'Active').slice(0, 8).map(d => {
                  const zaadVol  = d.walletProvider === 'Zaad'    ? d.volume30d : d.walletProvider === 'Both' ? Math.round(d.volume30d * 0.6) : 0;
                  const edahabVol = d.walletProvider === 'e-Dahab' ? d.volume30d : d.walletProvider === 'Both' ? Math.round(d.volume30d * 0.4) : 0;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{d.name}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.tier === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>Tier {d.tier}</span>
                      </td>
                      <td className="px-4 py-2.5 text-green-700">{zaadVol > 0 ? `$${zaadVol.toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-2.5 text-purple-700">{edahabVol > 0 ? `$${edahabVol.toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          d.walletProvider === 'Zaad' ? 'bg-green-100 text-green-800' :
                          d.walletProvider === 'e-Dahab' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>{d.walletProvider}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
