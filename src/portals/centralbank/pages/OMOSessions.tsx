import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, X, CheckCircle } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { omoSessions } from '../../../data/mockData';
import type { OMOSession } from '../../../types';

const fmtUSD = (n: number) => `$${n.toLocaleString()}`;

const CreateOMOModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({
    type: 'Injection',
    totalAmount: '',
    fixedRate: '',
    duration: '120',
    customDuration: '',
    tier1: true,
    tier2: true,
    maxBidTier1: '',
    maxBidTier2: '',
    allocationMethod: 'Best Bid Price Wins',
    sendSMS: true,
    startImmediately: true,
  });
  const [created, setCreated] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreated(true);
  };

  if (created) {
    return (
      <Modal isOpen={isOpen} onClose={() => { setCreated(false); onClose(); }} title="OMO Session Created">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center bg-green-100 text-green-600 rounded-full w-16 h-16 mb-4">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Session Created Successfully</h3>
          <p className="text-gray-500 text-sm mt-2">OMO-2024-004 has been created and notifications sent to eligible dealers.</p>
          <button
            onClick={() => { setCreated(false); onClose(); }}
            className="mt-6 bg-bos-green text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-bos-green/90"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New OMO Session" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Session Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
          <div className="flex gap-4">
            {['Injection', 'Absorption'].map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value={t} checked={form.type === t} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="accent-bos-green" />
                <span className="text-sm text-gray-700">{t}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (USD)</label>
            <input type="number" placeholder="e.g. 2000000" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Exchange Rate (SL/USD)</label>
            <input type="number" placeholder="e.g. 10000" value={form.fixedRate} onChange={e => setForm(f => ({ ...f, fixedRate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30" required />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Duration</label>
          <div className="flex flex-wrap gap-3">
            {[{ label: '1 hour', val: '60' }, { label: '2 hours', val: '120' }, { label: '4 hours', val: '240' }, { label: 'Custom', val: 'custom' }].map(opt => (
              <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="duration" value={opt.val} checked={form.duration === opt.val} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="accent-bos-green" />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
          {form.duration === 'custom' && (
            <input type="number" placeholder="Minutes" value={form.customDuration} onChange={e => setForm(f => ({ ...f, customDuration: e.target.value }))}
              className="mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30 w-32" />
          )}
        </div>

        {/* Eligible Tiers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Eligible Participant Tiers</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.tier1} onChange={e => setForm(f => ({ ...f, tier1: e.target.checked }))} className="accent-bos-green" />
              <span className="text-sm text-gray-700">Tier 1 Dealers</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.tier2} onChange={e => setForm(f => ({ ...f, tier2: e.target.checked }))} className="accent-bos-green" />
              <span className="text-sm text-gray-700">Tier 2 Dealers</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Bid per Dealer (Tier 1)</label>
            <input type="number" placeholder="e.g. 500000" value={form.maxBidTier1} onChange={e => setForm(f => ({ ...f, maxBidTier1: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Bid per Dealer (Tier 2)</label>
            <input type="number" placeholder="e.g. 200000" value={form.maxBidTier2} onChange={e => setForm(f => ({ ...f, maxBidTier2: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
          </div>
        </div>

        {/* Allocation Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Allocation Method</label>
          <div className="flex gap-4">
            {['Equal Distribution', 'Best Bid Price Wins'].map(m => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="alloc" value={m} checked={form.allocationMethod === m} onChange={e => setForm(f => ({ ...f, allocationMethod: e.target.value }))} className="accent-bos-green" />
                <span className="text-sm text-gray-700">{m}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2 bg-gray-50 rounded-lg p-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.sendSMS} onChange={e => setForm(f => ({ ...f, sendSMS: e.target.checked }))} className="accent-bos-green" />
            <span className="text-sm text-gray-700">Send SMS notification to all eligible dealers</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.startImmediately} onChange={e => setForm(f => ({ ...f, startImmediately: e.target.checked }))} className="accent-bos-green" />
            <span className="text-sm text-gray-700">Start session immediately upon creation</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" className="px-5 py-2 bg-bos-green text-white rounded-lg text-sm font-semibold hover:bg-bos-green/90">
            Create Session
          </button>
        </div>
      </form>
    </Modal>
  );
};

const OMOSessions: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'Active' | 'Completed' | 'Cancelled'>('Active');
  const [showCreate, setShowCreate] = useState(false);

  const filteredSessions = (): OMOSession[] => {
    if (tab === 'Active') return omoSessions.filter(s => s.status === 'Open' || s.status === 'Pending Allocation');
    if (tab === 'Completed') return omoSessions.filter(s => s.status === 'Completed');
    return omoSessions.filter(s => s.status === 'Cancelled');
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OMO Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Open Market Operations management</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-bos-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-bos-green/90">
          <Plus size={16} /> Create New OMO Session
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['Active', 'Completed', 'Cancelled'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
            <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">
              {filteredSessions().length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Session ID', 'Type', 'Fixed Rate', 'Total Amount', 'Eligible Tiers', 'Start Time', 'Duration', 'Status', 'Bids', 'Allocated', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSessions().map(s => {
                const totalBids = s.bids.reduce((a, b) => a + b.bidAmount, 0);
                const allocated = s.bids.filter(b => b.status === 'Allocated').reduce((a, b) => a + (b.allocatedAmount || 0), 0);
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-600 font-medium">{s.id}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.type} /></td>
                    <td className="px-4 py-3 font-medium">SL {s.fixedRate.toLocaleString()}</td>
                    <td className="px-4 py-3">{fmtUSD(s.totalAmount)}</td>
                    <td className="px-4 py-3">Tier {s.eligibleTiers.join(' & ')}</td>
                    <td className="px-4 py-3 text-gray-500">{s.startTime.replace('T', ' ').slice(0, 16)}</td>
                    <td className="px-4 py-3 text-gray-500">{s.duration} min</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">{s.bids.length} ({fmtUSD(totalBids)})</td>
                    <td className="px-4 py-3">{allocated > 0 ? fmtUSD(allocated) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/centralbank-portal/omo-sessions/${s.id}`)}
                          className="flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium">
                          <Eye size={12} /> View
                        </button>
                        {(s.status === 'Open') && (
                          <button className="flex items-center gap-1 text-red-500 hover:underline text-xs font-medium">
                            <X size={12} /> Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredSessions().length === 0 && (
          <p className="text-center text-gray-400 py-12">No sessions in this category.</p>
        )}
      </div>

      <CreateOMOModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
};

export default OMOSessions;
