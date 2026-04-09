import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Eye, RefreshCw } from 'lucide-react';
import KPICard from '../../../components/ui/KPICard';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { api } from '../../../api/client';

const fmtUSD = (n: number) => `$${Number(n).toLocaleString()}`;

interface APITransaction {
  id: string;
  refNumber: string;
  type: string;
  amountUSD: number;
  mobileNumber: string;
  telcoOperator: string;
  walletType: string;
  timestamp: string;
  status: string;
}

interface APIAlert {
  id: string;
  alertCode: string;
  type: string;
  dealerId: string;
  dealer: { id: string; name: string };
  customerWallet: string;
  mobileNumber: string;
  amount: number;
  triggerRule: string;
  priority: string;
  status: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  notes: string | null;
  createdAt: string;
  transactions: { alertId: string; transactionId: string; transaction: APITransaction }[];
}

const statusForBadge = (s: string) => s === 'UnderReview' ? 'Under Review' : s;

const AMLAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<APIAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<APIAlert | null>(null);
  const [actionLoading, setActionLoading] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (filterPriority !== 'All') params.set('priority', filterPriority);
      if (filterStatus !== 'All') params.set('status', filterStatus === 'Under Review' ? 'UnderReview' : filterStatus);
      const res = await api.get<{ data: APIAlert[] }>(`/aml-alerts?${params}`);
      setAlerts(res.data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [filterPriority, filterStatus]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const updateStatus = async (id: string, status: 'New' | 'UnderReview' | 'Resolved') => {
    setActionLoading(id + status);
    try {
      await api.patch(`/aml-alerts/${id}/status`, { status });
      await fetchAlerts();
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleMarkReview = (id: string) => updateStatus(id, 'UnderReview');
  const handleResolve   = (id: string) => { updateStatus(id, 'Resolved'); setSelected(null); };

  const total       = alerts.length;
  const high        = alerts.filter(a => a.priority === 'High').length;
  const underReview = alerts.filter(a => a.status === 'UnderReview').length;
  const resolved    = alerts.filter(a => a.status === 'Resolved').length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AML Alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Anti-money laundering monitoring and compliance alerts</p>
        </div>
        <button onClick={fetchAlerts} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50" title="Refresh">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Alerts"  value={total}       icon={ShieldAlert}   iconColor="text-gray-600"   iconBg="bg-gray-100" />
        <KPICard title="High Priority" value={high}        icon={AlertTriangle} iconColor="text-red-600"    iconBg="bg-red-50" />
        <KPICard title="Under Review"  value={underReview} icon={Clock}         iconColor="text-yellow-600" iconBg="bg-yellow-50" />
        <KPICard title="Resolved"      value={resolved}    icon={CheckCircle}   iconColor="text-green-600"  iconBg="bg-green-50" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['All', 'High', 'Medium', 'Low'].map(f => (
            <button key={f} onClick={() => setFilterPriority(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filterPriority === f ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['All', 'New', 'Under Review', 'Resolved'].map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === f ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && alerts.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
            <RefreshCw size={16} className="animate-spin" /> Loading alerts...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Alert ID', 'Type', 'Dealer', 'Amount', 'Trigger Rule', 'Timestamp', 'Priority', 'Status', 'Txns', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {alerts.map(a => (
                  <tr key={a.id} className={`hover:bg-gray-50 ${a.priority === 'High' && a.status !== 'Resolved' ? 'border-l-2 border-red-400' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{a.alertCode}</td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700">{a.type}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 text-sm">{a.dealer?.name ?? a.dealerId}</td>
                    <td className="px-4 py-3 font-semibold">{fmtUSD(a.amount)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-48 truncate" title={a.triggerRule}>{a.triggerRule}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{a.createdAt.replace('T', ' ').slice(0, 16)}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={statusForBadge(a.status)} /></td>
                    <td className="px-4 py-3 text-center text-xs font-semibold text-gray-600">{a.transactions.length}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setSelected(a)} className="flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium">
                          <Eye size={12} /> View
                        </button>
                        {a.status === 'New' && (
                          <button
                            onClick={() => handleMarkReview(a.id)}
                            disabled={actionLoading === a.id + 'UnderReview'}
                            className="text-yellow-600 hover:underline text-xs font-medium disabled:opacity-50">
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && alerts.length === 0 && (
          <p className="text-center text-gray-400 py-12">No alerts match the selected filters.</p>
        )}
      </div>

      {/* Alert Detail Modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Alert Detail — ${selected.alertCode}`} size="xl">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Alert Type',     value: selected.type },
                { label: 'Priority',       value: <StatusBadge status={selected.priority} size="md" /> },
                { label: 'Dealer',         value: selected.dealer?.name ?? selected.dealerId },
                { label: 'Status',         value: <StatusBadge status={statusForBadge(selected.status)} size="md" /> },
                { label: 'Amount Flagged', value: fmtUSD(selected.amount) },
                { label: 'Detected At',    value: selected.createdAt.replace('T', ' ').slice(0, 16) },
                { label: 'Mobile Number',  value: selected.mobileNumber },
                { label: 'Wallet',         value: selected.customerWallet },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                  <div className="font-semibold text-gray-800 text-sm mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-700 mb-1">Trigger Rule</p>
              <p className="text-sm text-red-800">{selected.triggerRule}</p>
            </div>

            {selected.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-yellow-700 mb-1">Notes</p>
                <p className="text-sm text-yellow-800">{selected.notes}</p>
              </div>
            )}

            {/* Triggering Transactions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                Triggering Transactions
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({selected.transactions.length} transaction{selected.transactions.length !== 1 ? 's' : ''})
                </span>
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                {selected.transactions.length > 1
                  ? 'All transactions that contributed to triggering this alert.'
                  : 'The transaction that triggered this alert.'}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Ref #', 'Type', 'Mobile Number', 'Telco', 'Wallet', 'Amount USD', 'Timestamp', 'Status'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-2 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selected.transactions.map(({ transaction: tx }) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-gray-500">{tx.refNumber.slice(-8)}</td>
                        <td className="px-3 py-2"><StatusBadge status={tx.type} /></td>
                        <td className="px-3 py-2 font-mono font-semibold text-gray-800">{tx.mobileNumber}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${tx.telcoOperator === 'Telesom' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {tx.telcoOperator}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${tx.walletType === 'Zaad' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                            {tx.walletType}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-semibold">{fmtUSD(tx.amountUSD)}</td>
                        <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{tx.timestamp.replace('T', ' ').slice(0, 16)}</td>
                        <td className="px-3 py-2"><StatusBadge status={tx.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Close
              </button>
              {selected.status === 'New' && (
                <button
                  onClick={() => handleMarkReview(selected.id)}
                  disabled={!!actionLoading}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-semibold hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2">
                  <Clock size={15} /> Mark Under Review
                </button>
              )}
              {selected.status !== 'Resolved' && (
                <button
                  onClick={() => handleResolve(selected.id)}
                  disabled={!!actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                  <CheckCircle size={15} /> Mark Resolved
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AMLAlerts;
