import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, X, CheckCircle, RefreshCw } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { api } from '../../../api/client';

const fmtUSD = (n: number) => `$${Number(n).toLocaleString()}`;

interface APIOMOSession {
  id: string;
  type: 'Injection' | 'Absorption';
  fixedRate: string | number;
  totalAmount: string | number;
  startTime: string;
  durationMinutes: number;
  allocationMethod: string;
  maxBidTier1: string | number;
  maxBidTier2: string | number;
  notes: string | null;
  createdBy: string;
  status: 'Open' | 'Completed' | 'Cancelled';
  closedAt: string | null;
  createdAt: string;
  _count?: { bids: number };
}

// ─── Create OMO Modal ────────────────────────────────────────────────────────

interface CreateOMOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (session: APIOMOSession) => void;
}

const CreateOMOModal: React.FC<CreateOMOModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState({
    type: 'Injection',
    totalAmount: '',
    fixedRate: '',
    duration: '120',
    customDuration: '',
    maxBidTier1: '',
    maxBidTier2: '',
    allocationMethod: 'BestBidPriceWins',
    notes: '',
  });
  const [created, setCreated] = useState<APIOMOSession | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const durationMinutes = form.duration === 'custom'
      ? Number(form.customDuration)
      : Number(form.duration);

    try {
      const session = await api.post<APIOMOSession>('/omo-sessions', {
        type: form.type,
        fixedRate: Number(form.fixedRate),
        totalAmount: Number(form.totalAmount),
        startTime: new Date().toISOString(),
        durationMinutes,
        allocationMethod: form.allocationMethod,
        maxBidTier1: Number(form.maxBidTier1) || 500000,
        maxBidTier2: Number(form.maxBidTier2) || 200000,
        notes: form.notes || undefined,
      });
      setCreated(session);
      onCreated(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session. Ensure you are logged in as CB staff.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCreated(null);
    setError('');
    setForm({ type: 'Injection', totalAmount: '', fixedRate: '', duration: '120', customDuration: '', maxBidTier1: '', maxBidTier2: '', allocationMethod: 'BestBidPriceWins', notes: '' });
    onClose();
  };

  if (created) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="OMO Session Created">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center bg-green-100 text-green-600 rounded-full w-16 h-16 mb-4">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Session Created Successfully</h3>
          <p className="text-gray-500 text-sm mt-2">
            {created.id} has been created and notifications sent to eligible dealers.
          </p>
          <button onClick={handleClose} className="mt-6 bg-bos-green text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-bos-green/90">
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New OMO Session" size="lg">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.allocationMethod === 'BestBidPriceWins' ? 'Baseline Rate (SL/USD)' : 'Fixed Rate (SL/USD)'}
            </label>
            <input type="number" placeholder="e.g. 570" value={form.fixedRate} onChange={e => setForm(f => ({ ...f, fixedRate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30" required />
            <p className="text-xs text-gray-400 mt-1">
              {form.allocationMethod === 'BestBidPriceWins'
                ? form.type === 'Injection'
                  ? 'Dealers must bid at or above this rate. Highest rates win.'
                  : 'Dealers must bid at or below this rate. Lowest rates win.'
                : 'All dealers settle at this single rate.'}
            </p>
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
          <div className="flex gap-6">
            {[
              { label: 'Allotment', val: 'EqualDistribution', hint: 'Each dealer receives a proportional share based on their bid amount.' },
              { label: 'Best Bid Price Wins', val: 'BestBidPriceWins', hint: 'Dealers submit a competitive rate. Best rates are filled first.' },
            ].map(m => (
              <label key={m.val} className="flex items-start gap-2 cursor-pointer">
                <input type="radio" name="alloc" value={m.val} checked={form.allocationMethod === m.val}
                  onChange={e => setForm(f => ({ ...f, allocationMethod: e.target.value }))}
                  className="accent-bos-green mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-gray-700">{m.label}</span>
                  <p className="text-xs text-gray-400">{m.hint}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <input type="text" placeholder="e.g. Quarterly injection" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-green/30" />
        </div>

        {error && (
          <div className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={handleClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="px-5 py-2 bg-bos-green text-white rounded-lg text-sm font-semibold hover:bg-bos-green/90 disabled:opacity-60">
            {submitting ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const OMOSessions: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'Active' | 'Completed' | 'Cancelled'>('Active');
  const [showCreate, setShowCreate] = useState(false);
  const [sessions, setSessions] = useState<APIOMOSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await api.get<{ data: APIOMOSession[] } | APIOMOSession[]>('/omo-sessions?limit=100');
      const list = Array.isArray(res) ? res : (res as { data: APIOMOSession[] }).data;
      setSessions(list);
    } catch {
      // backend unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const handleCreated = (session: APIOMOSession) => {
    setSessions(prev => [session, ...prev]);
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this OMO session?')) return;
    setCancelling(id);
    try {
      const updated = await api.patch<APIOMOSession>(`/omo-sessions/${id}/cancel`);
      setSessions(prev => prev.map(s => s.id === id ? updated : s));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel session');
    } finally {
      setCancelling(null);
    }
  };

  const filteredSessions = () => {
    if (tab === 'Active') return sessions.filter(s => s.status === 'Open');
    if (tab === 'Completed') return sessions.filter(s => s.status === 'Completed');
    return sessions.filter(s => s.status === 'Cancelled');
  };

  const filtered = filteredSessions();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OMO Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Open Market Operations management</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchSessions} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-bos-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-bos-green/90">
            <Plus size={16} /> Create New OMO Session
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['Active', 'Completed', 'Cancelled'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
            <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">
              {t === 'Active' ? sessions.filter(s => s.status === 'Open').length
                : t === 'Completed' ? sessions.filter(s => s.status === 'Completed').length
                : sessions.filter(s => s.status === 'Cancelled').length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Session ID', 'Type', 'Fixed Rate', 'Total Amount', 'Start Time', 'Duration', 'Allocation', 'Status', 'Bids', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-blue-600 font-medium text-xs">{s.id}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.type} /></td>
                  <td className="px-4 py-3 font-medium">SL {Number(s.fixedRate).toLocaleString()}</td>
                  <td className="px-4 py-3">{fmtUSD(Number(s.totalAmount))}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.startTime.replace('T', ' ').slice(0, 16)}</td>
                  <td className="px-4 py-3 text-gray-500">{s.durationMinutes} min</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {s.allocationMethod === 'EqualDistribution' ? 'Allotment' : 'Best Bid'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-gray-600">{s._count?.bids ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/centralbank-portal/omo-sessions/${s.id}`)}
                        className="flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium">
                        <Eye size={12} /> View
                      </button>
                      {s.status === 'Open' && (
                        <button
                          onClick={() => handleCancel(s.id)}
                          disabled={cancelling === s.id}
                          className="flex items-center gap-1 text-red-500 hover:underline text-xs font-medium disabled:opacity-50">
                          <X size={12} /> {cancelling === s.id ? '...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-12">No sessions in this category.</p>
        )}
        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
            <RefreshCw size={14} className="animate-spin" /> Loading sessions...
          </div>
        )}
      </div>

      <CreateOMOModal isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
    </div>
  );
};

export default OMOSessions;
