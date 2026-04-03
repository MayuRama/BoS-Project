import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import { allocationResults } from '../../../data/mockData';

const fmtUSD = (n: number) => `$${n.toLocaleString()}`;
const fmtSL = (n: number) => `SL ${(n / 1000000).toFixed(2)}M`;

const AllocationResults: React.FC = () => {
  const pending = allocationResults.filter(r => r.settlementStatus === 'Pending');
  const hasPartialAlloc = allocationResults.some(r => r.allocatedAmount < r.bidAmount && r.allocatedAmount > 0);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Allocation Results</h1>
        <p className="text-sm text-gray-500 mt-0.5">OMO session allocations and settlement status</p>
      </div>

      {/* Pending settlement banner */}
      {pending.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-800 font-semibold text-sm">
              {pending.length} allocation{pending.length > 1 ? 's' : ''} pending settlement
            </p>
            <p className="text-yellow-700 text-xs mt-0.5">
              Please ensure your wallets have sufficient SL Shilling balance for settlement processing.
            </p>
          </div>
        </div>
      )}

      {hasPartialAlloc && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
          <CheckCircle size={16} className="text-blue-600" />
          <p className="text-blue-700 text-sm">Some sessions resulted in partial allocations. Contact BoS FX desk for details.</p>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Allocated', value: fmtUSD(allocationResults.reduce((a, r) => a + r.allocatedAmount, 0)), color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
          { label: 'Settled', value: fmtUSD(allocationResults.filter(r => r.settlementStatus === 'Completed').reduce((a, r) => a + r.allocatedAmount, 0)), color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Pending Settlement', value: fmtUSD(pending.reduce((a, r) => a + r.allocatedAmount, 0)), color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border ${c.bg} p-4`}>
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color} mt-1`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Session ID', 'Session Date', 'Bid Amount', 'Allocated Amount', 'Fixed Rate', 'SL Settlement', 'Settlement Status', 'Wallet', 'Timestamp'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allocationResults.map(r => (
                <tr key={r.id} className={`hover:bg-gray-50 ${r.settlementStatus === 'Pending' ? 'border-l-2 border-yellow-400' : ''}`}>
                  <td className="px-4 py-3 font-mono text-blue-600 font-medium text-xs">{r.sessionId}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.sessionDate}</td>
                  <td className="px-4 py-3">{fmtUSD(r.bidAmount)}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">
                    {r.allocatedAmount > 0 ? fmtUSD(r.allocatedAmount) : <span className="text-gray-400">Not allocated</span>}
                  </td>
                  <td className="px-4 py-3">SL {r.fixedRate.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.slSettlement > 0 ? fmtSL(r.slSettlement) : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.settlementStatus} /></td>
                  <td className="px-4 py-3 text-gray-500">{r.wallet}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.timestamp.replace('T', ' ').slice(0, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {allocationResults.length === 0 && (
          <p className="text-center text-gray-400 py-12">No allocation results found.</p>
        )}
      </div>
    </div>
  );
};

export default AllocationResults;
