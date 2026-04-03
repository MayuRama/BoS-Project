import React, { useState } from 'react';
import { ShieldAlert, Eye } from 'lucide-react';
import KPICard from '../../../components/ui/KPICard';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { amlAlerts } from '../../../data/mockData';
import type { AMLAlert } from '../../../types';

const fmtUSD = (n: number) => `$${n.toLocaleString()}`;

const AMLAlerts: React.FC = () => {
  const [selected, setSelected] = useState<AMLAlert | null>(null);
  const [alerts, setAlerts] = useState(amlAlerts);
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const filtered = alerts.filter(a => {
    const matchPriority = filterPriority === 'All' || a.priority === filterPriority;
    const matchStatus = filterStatus === 'All' || a.status === filterStatus;
    return matchPriority && matchStatus;
  });

  const total = alerts.length;
  const high = alerts.filter(a => a.priority === 'High').length;
  const underReview = alerts.filter(a => a.status === 'Under Review').length;
  const resolved = alerts.filter(a => a.status === 'Resolved').length;

  const handleResolve = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Resolved' as const } : a));
    setSelected(null);
  };

  const handleMarkReview = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Under Review' as const } : a));
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AML Alerts</h1>
        <p className="text-sm text-gray-500 mt-0.5">Anti-money laundering monitoring and compliance alerts</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Alerts" value={total} icon={ShieldAlert} iconColor="text-gray-600" iconBg="bg-gray-100" />
        <KPICard title="High Priority" value={high} icon={AlertTriangle} iconColor="text-red-600" iconBg="bg-red-50" />
        <KPICard title="Under Review" value={underReview} icon={Clock} iconColor="text-yellow-600" iconBg="bg-yellow-50" />
        <KPICard title="Resolved" value={resolved} icon={CheckCircle} iconColor="text-green-600" iconBg="bg-green-50" />
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Alert ID', 'Type', 'Dealer', 'Amount', 'Trigger Rule', 'Timestamp', 'Priority', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(a => (
                <tr key={a.id} className={`hover:bg-gray-50 ${a.priority === 'High' && a.status !== 'Resolved' ? 'border-l-2 border-red-400' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{a.id}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-gray-700">{a.type}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 text-sm">{a.dealerName}</td>
                  <td className="px-4 py-3 font-semibold">{fmtUSD(a.amount)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-48 truncate" title={a.triggerRule}>{a.triggerRule}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{a.timestamp.replace('T', ' ').slice(0, 16)}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(a)} className="flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium">
                        <Eye size={12} /> View
                      </button>
                      {a.status === 'New' && (
                        <button onClick={() => handleMarkReview(a.id)} className="text-yellow-600 hover:underline text-xs font-medium">Review</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-12">No alerts match the selected filters.</p>}
      </div>

      {/* Alert Detail Modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Alert Detail — ${selected.id}`} size="xl">
          <div className="space-y-5">
            {/* Alert summary */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Alert Type', value: selected.type },
                { label: 'Priority', value: <StatusBadge status={selected.priority} size="md" /> },
                { label: 'Dealer', value: selected.dealerName },
                { label: 'Status', value: <StatusBadge status={selected.status} size="md" /> },
                { label: 'Amount Flagged', value: fmtUSD(selected.amount) },
                { label: 'Detected At', value: selected.timestamp.replace('T', ' ').slice(0, 16) },
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

            {/* Transactions that triggered alert */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Triggering Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Ref #', 'Type', 'Mobile Number', 'Telco', 'Wallet', 'Amount USD', 'Rate', 'Timestamp', 'Status'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-3 py-2 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selected.transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-gray-500">{tx.refNumber.slice(-6)}</td>
                        <td className="px-3 py-2"><StatusBadge status={tx.type} /></td>
                        <td className="px-3 py-2 font-mono font-semibold text-gray-800">{tx.mobileNumber}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                            tx.telcoOperator === 'Telesom' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          }`}>{tx.telcoOperator}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            tx.walletType === 'Zaad' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                          }`}>{tx.walletType}</span>
                        </td>
                        <td className="px-3 py-2 font-semibold">{fmtUSD(tx.amountUSD)}</td>
                        <td className="px-3 py-2">SL {tx.rate}</td>
                        <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{tx.timestamp.replace('T', ' ').slice(0, 16)}</td>
                        <td className="px-3 py-2"><StatusBadge status={tx.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Close</button>
              {selected.status !== 'Resolved' && (
                <button onClick={() => handleResolve(selected.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center gap-2">
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
