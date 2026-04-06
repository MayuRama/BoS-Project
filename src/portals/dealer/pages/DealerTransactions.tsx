import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Smartphone, RefreshCw } from 'lucide-react';
import KPICard from '../../../components/ui/KPICard';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { api } from '../../../api/client';
import type { Transaction } from '../../../types';

const ITEMS_PER_PAGE = 10;

const telcoBadge = (telco: string) => {
  const styles: Record<string, string> = {
    Telesom: 'bg-blue-50 text-blue-700 border border-blue-200',
    Somtel:  'bg-purple-50 text-purple-700 border border-purple-200',
    Soltelco:'bg-gray-50 text-gray-600 border border-gray-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[telco] ?? styles.Soltelco}`}>
      {telco}
    </span>
  );
};

const walletBadge = (wallet: string) => {
  const styles: Record<string, string> = {
    'Zaad':    'bg-green-50 text-green-700 border border-green-200',
    'e-Dahab': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[wallet] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
      {wallet}
    </span>
  );
};

const DealerTransactions: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterTelco, setFilterTelco] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [allTx, setAllTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: unknown[] }>('/transactions?limit=200&dealerId=D002');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAllTx(res.data.map((t: any) => ({
        ...t,
        type: t.type === 'BuyUSD' ? 'Buy USD' : 'Sell USD',
        telcoOperator: t.telcoOperator,
        walletType: t.walletType === 'eDahab' ? 'e-Dahab' : t.walletType,
        dealerName: t.dealer?.name ?? t.dealerName ?? '',
      })) as Transaction[]);
      setLastRefresh(new Date());
    } catch {
      // backend not available — leave existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    // Poll every 10 seconds for new USSD transactions
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  const filtered = allTx.filter(tx => {
    const matchType   = filterType   === 'All' || tx.type           === filterType;
    const matchStatus = filterStatus === 'All' || tx.status         === filterStatus;
    const matchTelco  = filterTelco  === 'All' || tx.telcoOperator  === filterTelco;
    const matchSearch = search === '' ||
      tx.refNumber.toLowerCase().includes(search.toLowerCase()) ||
      tx.customerWallet.includes(search) ||
      tx.mobileNumber.includes(search);
    return matchType && matchStatus && matchTelco && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalVolume = allTx.reduce((a, t) => a + t.amountUSD, 0);
  const buyVolume   = allTx.filter(t => t.type === 'Buy USD').reduce((a, t) => a + t.amountUSD, 0);
  const sellVolume  = allTx.filter(t => t.type === 'Sell USD').reduce((a, t) => a + t.amountUSD, 0);
  const pending     = allTx.filter(t => t.status === 'Pending').length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete transaction history with customer mobile &amp; telco details</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Last updated: {lastRefresh.toLocaleTimeString()}</span>
          <button onClick={fetchTransactions} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Volume"  value={`$${(totalVolume / 1000).toFixed(0)}K`} icon={DollarSign}  iconColor="text-blue-600"   iconBg="bg-blue-50" />
        <KPICard title="Buy Volume"    value={`$${(buyVolume   / 1000).toFixed(0)}K`} icon={TrendingUp}  iconColor="text-green-600"  iconBg="bg-green-50" />
        <KPICard title="Sell Volume"   value={`$${(sellVolume  / 1000).toFixed(0)}K`} icon={TrendingDown} iconColor="text-orange-600" iconBg="bg-orange-50" />
        <KPICard title="Pending"       value={pending}                                icon={Clock}       iconColor="text-yellow-600" iconBg="bg-yellow-50" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search ref #, wallet or mobile..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-blue/20"
          />
        </div>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none">
          <option value="All">All Types</option>
          <option value="Buy USD">Buy USD</option>
          <option value="Sell USD">Sell USD</option>
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none">
          <option value="All">All Status</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select value={filterTelco} onChange={e => { setFilterTelco(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none">
          <option value="All">All Telcos</option>
          <option value="Telesom">Telesom</option>
          <option value="Somtel">Somtel</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
        <span className="text-gray-400 text-sm self-center">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Ref #', 'Type', 'Mobile Number', 'Telco', 'Wallet', 'Amount (USD)', 'Amount (SL)', 'Rate', 'Status', 'Timestamp', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{tx.refNumber}</td>
                  <td className="px-4 py-3"><StatusBadge status={tx.type} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Smartphone size={12} className="text-gray-400 shrink-0" />
                      <span className="font-mono text-xs text-gray-700">{tx.mobileNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{telcoBadge(tx.telcoOperator)}</td>
                  <td className="px-4 py-3">{walletBadge(tx.walletType)}</td>
                  <td className="px-4 py-3 font-semibold">${tx.amountUSD.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">SL {tx.amountSL.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">SL {tx.rate.toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{tx.timestamp.replace('T', ' ').slice(0, 16)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedTx(tx)} className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-12">No transactions match the filters.</p>}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 text-sm rounded-lg ${page === i + 1 ? 'bg-bos-blue text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <Modal isOpen={!!selectedTx} onClose={() => setSelectedTx(null)} title={`Transaction — ${selectedTx.refNumber}`} size="md">
          <div className="space-y-3">
            {[
              { label: 'Reference Number', value: selectedTx.refNumber },
              { label: 'Type',             value: <StatusBadge status={selectedTx.type} size="md" /> },
              { label: 'Mobile Number',    value: <span className="font-mono flex items-center gap-1.5"><Smartphone size={13} className="text-gray-400" />{selectedTx.mobileNumber}</span> },
              { label: 'Telco Operator',   value: telcoBadge(selectedTx.telcoOperator) },
              { label: 'Wallet Type',      value: walletBadge(selectedTx.walletType) },
              { label: 'Customer Wallet',  value: <span className="font-mono text-xs">{selectedTx.customerWallet}</span> },
              { label: 'Amount (USD)',      value: `$${selectedTx.amountUSD.toLocaleString()}` },
              { label: 'Amount (SL Shilling)', value: `SL ${selectedTx.amountSL.toLocaleString()}` },
              { label: 'Exchange Rate',    value: `SL ${selectedTx.rate.toLocaleString()} / USD` },
              { label: 'Status',           value: <StatusBadge status={selectedTx.status} size="md" /> },
              { label: 'Dealer',           value: selectedTx.dealerName },
              { label: 'Timestamp',        value: selectedTx.timestamp.replace('T', ' ').slice(0, 19) },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-semibold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DealerTransactions;
