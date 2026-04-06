import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Search, Filter, Download, Smartphone, Wifi, RefreshCw } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import KPICard from '../../../components/ui/KPICard';
import Modal from '../../../components/ui/Modal';
import { DollarSign, Activity } from 'lucide-react';
import { telcoVolumeData, telcoSplit } from '../../../data/mockData';
import { api } from '../../../api/client';
import type { Transaction } from '../../../types';

const TELCO_COLORS: Record<string, string> = {
  'Telesom (Zaad)':   '#6ab04c',
  'Somtel (e-Dahab)': '#1e40af',
};
const PIE_COLORS = ['#6ab04c', '#1e40af'];

const fmtUSD = (n: number) => `$${n.toLocaleString()}`;
const fmtSL  = (n: number) => `SL ${n.toLocaleString()}`;

const ITEMS_PER_PAGE = 15;

const USSDTransactions: React.FC = () => {
  const [search, setSearch]             = useState('');
  const [filterTelco, setFilterTelco]   = useState('All');
  const [filterWallet, setFilterWallet] = useState('All');
  const [filterType, setFilterType]     = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState<Transaction | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: unknown[] }>('/transactions?limit=500');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAllTransactions(res.data.map((t: any) => ({
        ...t,
        type: t.type === 'BuyUSD' ? 'Buy USD' : 'Sell USD',
        walletType: t.walletType === 'eDahab' ? 'e-Dahab' : t.walletType,
        dealerName: t.dealer?.name ?? t.dealerName ?? '',
      })) as Transaction[]);
      setLastRefresh(new Date());
    } catch {
      // backend unavailable — keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  const filtered = allTransactions.filter(tx => {
    const matchSearch =
      !search ||
      tx.mobileNumber.includes(search) ||
      tx.refNumber.toLowerCase().includes(search.toLowerCase()) ||
      tx.dealerName.toLowerCase().includes(search.toLowerCase()) ||
      tx.customerWallet.includes(search);
    const matchTelco   = filterTelco   === 'All' || tx.telcoOperator === filterTelco;
    const matchWallet  = filterWallet  === 'All' || tx.walletType    === filterWallet;
    const matchType    = filterType    === 'All' || tx.type          === filterType;
    const matchStatus  = filterStatus  === 'All' || tx.status        === filterStatus;
    return matchSearch && matchTelco && matchWallet && matchType && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalVolume    = filtered.reduce((s, t) => s + t.amountUSD, 0);
  const telesomVolume  = filtered.filter(t => t.telcoOperator === 'Telesom').reduce((s, t) => s + t.amountUSD, 0);
  const somtelVolume   = filtered.filter(t => t.telcoOperator === 'Somtel').reduce((s, t) => s + t.amountUSD, 0);
  const completedCount = filtered.filter(t => t.status === 'Completed').length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">USSD Transaction Monitor</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time monitoring of all FX transactions processed through the USSD platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Updated: {lastRefresh.toLocaleTimeString()}</span>
          <button onClick={fetchTransactions} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 shadow-sm">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Volume (Filtered)" value={fmtUSD(totalVolume)} icon={DollarSign}
          iconColor="text-green-600" iconBg="bg-green-50" />
        <KPICard title="Transactions" value={filtered.length} icon={Activity}
          iconColor="text-blue-600" iconBg="bg-blue-50"
          subtitle={`${completedCount} completed`} />
        <KPICard title="Telesom Volume" value={fmtUSD(telesomVolume)} icon={Smartphone}
          iconColor="text-emerald-600" iconBg="bg-emerald-50"
          subtitle="Via Zaad wallet" />
        <KPICard title="Somtel Volume" value={fmtUSD(somtelVolume)} icon={Wifi}
          iconColor="text-purple-600" iconBg="bg-purple-50"
          subtitle="Via e-Dahab wallet" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Volume by Telco — Last 7 Days (USD)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={telcoVolumeData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => fmtUSD(v)} />
              <Legend />
              <Bar dataKey="telesom" fill="#6ab04c" name="Telesom (Zaad)"   radius={[3, 3, 0, 0]} />
              <Bar dataKey="somtel"  fill="#1e40af" name="Somtel (e-Dahab)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Telco Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={telcoSplit} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                label={({ name, value }) => `${value}%`} labelLine={false}>
                {telcoSplit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
              <Tooltip formatter={(v: number) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search mobile, ref#, dealer..."
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/20"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Filter size={13} />
          </div>

          {/* Telco filter */}
          <select value={filterTelco} onChange={e => { setFilterTelco(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/20">
            <option value="All">All Telcos</option>
            <option value="Telesom">Telesom</option>
            <option value="Somtel">Somtel</option>
          </select>

          {/* Wallet filter */}
          <select value={filterWallet} onChange={e => { setFilterWallet(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/20">
            <option value="All">All Wallets</option>
            <option value="Zaad">Zaad</option>
            <option value="e-Dahab">e-Dahab</option>
          </select>

          {/* Type filter */}
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/20">
            <option value="All">All Types</option>
            <option value="Buy USD">Buy USD</option>
            <option value="Sell USD">Sell USD</option>
          </select>

          {/* Status filter */}
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/20">
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Ref #', 'Type', 'Mobile Number', 'Telco', 'Wallet', 'Amount (USD)', 'Amount (SL)', 'Rate', 'Dealer', 'Status', 'Timestamp'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(tx => (
                <tr key={tx.id}
                  onClick={() => setSelected(tx)}
                  className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-600 font-medium whitespace-nowrap">{tx.refNumber}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={tx.type} /></td>
                  <td className="px-4 py-2.5 font-mono text-sm font-semibold text-gray-800">{tx.mobileNumber}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      tx.telcoOperator === 'Telesom'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {tx.telcoOperator}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      tx.walletType === 'Zaad'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {tx.walletType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-gray-800">{fmtUSD(tx.amountUSD)}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{fmtSL(tx.amountSL)}</td>
                  <td className="px-4 py-2.5 text-gray-700 text-xs font-mono">SL {tx.rate}</td>
                  <td className="px-4 py-2.5 text-gray-700 text-xs max-w-32 truncate">{tx.dealerName}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={tx.status} /></td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                    {tx.timestamp.replace('T', ' ').slice(0, 16)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-12 text-sm">No transactions match the current filters.</p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-md text-xs font-medium ${p === page ? 'bg-bos-green text-white' : 'hover:bg-gray-100'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Transaction — ${selected.refNumber}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Transaction Type',    value: <StatusBadge status={selected.type} size="md" /> },
                { label: 'Status',              value: <StatusBadge status={selected.status} size="md" /> },
                { label: 'Mobile Number',       value: <span className="font-mono font-bold text-gray-900">{selected.mobileNumber}</span> },
                { label: 'Telco Operator',      value: (
                  <span className={`font-semibold text-sm ${selected.telcoOperator === 'Telesom' ? 'text-emerald-700' : 'text-blue-700'}`}>
                    {selected.telcoOperator}
                  </span>
                )},
                { label: 'Wallet Type',         value: selected.walletType },
                { label: 'Wallet Number',       value: <span className="font-mono text-sm">{selected.customerWallet}</span> },
                { label: 'Amount (USD)',         value: <span className="font-bold text-green-700">{fmtUSD(selected.amountUSD)}</span> },
                { label: 'Amount (SL)',          value: <span className="font-semibold">{fmtSL(selected.amountSL)}</span> },
                { label: 'Exchange Rate',        value: `SL ${selected.rate}/USD` },
                { label: 'Dealer',              value: selected.dealerName },
                { label: 'Reference Number',    value: <span className="font-mono text-xs">{selected.refNumber}</span> },
                { label: 'Timestamp',           value: selected.timestamp.replace('T', ' ').slice(0, 19) },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                  <div className="text-sm font-medium text-gray-800 mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Telco badge */}
            <div className={`rounded-lg p-3 flex items-center gap-3 ${
              selected.telcoOperator === 'Telesom'
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                selected.telcoOperator === 'Telesom' ? 'bg-emerald-500' : 'bg-blue-600'
              }`}>
                {selected.telcoOperator[0]}
              </div>
              <div>
                <p className={`text-sm font-semibold ${selected.telcoOperator === 'Telesom' ? 'text-emerald-800' : 'text-blue-800'}`}>
                  {selected.telcoOperator} Network
                </p>
                <p className="text-xs text-gray-500">
                  {selected.walletType} wallet · {selected.mobileNumber}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setSelected(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default USSDTransactions;
