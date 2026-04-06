import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { api } from '../../../api/client';

const fmtUSD = (n: number) => `$${Number(n).toLocaleString()}`;
const fmtSL  = (n: number) => `SL ${Number(n).toLocaleString()}`;

// ─── Types ───────────────────────────────────────────────────────────────────

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
  status: 'Open' | 'Completed' | 'Cancelled';
  createdAt: string;
  _count?: { bids: number };
}

interface LocalBid {
  sessionId: string;
  amount: number;
  wallet: string;
  submittedAt: string;
  status: 'Submitted';
}

// ─── Bid Modal ───────────────────────────────────────────────────────────────

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: APIOMOSession;
  onSubmit: (bid: LocalBid) => void;
  dealerTier: 'Tier1' | 'Tier2';
}

const BidModal: React.FC<BidModalProps> = ({ isOpen, onClose, session, onSubmit, dealerTier }) => {
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState('Zaad');
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const maxBid = dealerTier === 'Tier1' ? Number(session.maxBidTier1) : Number(session.maxBidTier2);
  const slEquiv = amount ? Number(amount) * Number(session.fixedRate) : 0;

  const handleClose = () => {
    onClose();
    setStep('form');
    setAmount('');
    setError('');
  };

  const handleSubmit = async () => {
    if (step === 'form') { setStep('confirm'); return; }
    if (step === 'confirm') {
      setSubmitting(true);
      setError('');
      try {
        // Map wallet: 'Zaad' → 'Zaad', 'eDahab' → 'eDahab'
        const walletVal = wallet === 'e-Dahab' ? 'eDahab' : wallet;
        await api.post(`/omo-sessions/${session.id}/bids`, {
          bidAmount: Number(amount),
          wallet: walletVal,
        });
        onSubmit({
          sessionId: session.id,
          amount: Number(amount),
          wallet,
          submittedAt: new Date().toISOString(),
          status: 'Submitted',
        });
        setStep('done');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit bid. Ensure you are logged in as a dealer.');
        setStep('form');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={step === 'done' ? 'Bid Submitted' : 'Submit OMO Bid'} size="md">
      {step === 'done' ? (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center bg-green-100 text-green-600 rounded-full w-16 h-16 mb-4">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Bid Submitted Successfully!</h3>
          <p className="text-gray-500 text-sm mt-2">Your bid of <span className="font-semibold">{fmtUSD(Number(amount))}</span> for session {session.id} has been received.</p>
          <p className="text-gray-400 text-xs mt-1">You will be notified once allocation results are available.</p>
          <button onClick={handleClose} className="mt-6 bg-bos-blue text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-bos-blue/90">Close</button>
        </div>
      ) : step === 'confirm' ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-blue-900">Please confirm your bid details</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Session', value: session.id },
                { label: 'Type', value: session.type },
                { label: 'Fixed Rate', value: fmtSL(Number(session.fixedRate)) },
                { label: 'Bid Amount', value: fmtUSD(Number(amount)) },
                { label: 'SL Equivalent', value: `SL ${slEquiv.toLocaleString()}` },
                { label: 'Settlement Wallet', value: wallet },
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-semibold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          {error && <div className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex gap-3">
            <button onClick={() => setStep('form')} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Back</button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-bos-blue text-white py-2 rounded-lg text-sm font-semibold hover:bg-bos-blue/90 disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Confirm & Submit'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Session details recap */}
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Session ID', value: session.id },
              { label: 'Type', value: session.type },
              { label: 'Fixed Rate', value: fmtSL(Number(session.fixedRate)) },
              { label: 'Your Max Bid', value: fmtUSD(maxBid) },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="font-semibold text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bid Amount (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              max={maxBid}
              min={1000}
              placeholder={`Max: ${fmtUSD(maxBid)}`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-blue/30"
            />
            {Number(amount) > maxBid && (
              <p className="text-red-500 text-xs mt-1">Amount exceeds your maximum bid limit of {fmtUSD(maxBid)}</p>
            )}
          </div>

          {amount && Number(amount) > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <p className="text-blue-700 font-medium">Estimated SL Settlement</p>
              <p className="text-blue-900 text-lg font-bold mt-0.5">SL {slEquiv.toLocaleString()}</p>
              <p className="text-blue-600 text-xs mt-0.5">at fixed rate of SL {Number(session.fixedRate).toLocaleString()} / USD</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Wallet</label>
            <select value={wallet} onChange={e => setWallet(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bos-blue/30">
              <option value="Zaad">Zaad (063-7712-002)</option>
              <option value="e-Dahab">e-Dahab (770-3312-002)</option>
            </select>
          </div>

          {error && <div className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button onClick={handleClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!amount || Number(amount) <= 0 || Number(amount) > maxBid}
              className="flex-1 bg-bos-blue text-white py-2 rounded-lg text-sm font-semibold hover:bg-bos-blue/90 disabled:opacity-50">
              Review Bid
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const DealerOMOSessions: React.FC = () => {
  const [tab, setTab] = useState<'Active' | 'My Bids' | 'Completed'>('Active');
  const [sessions, setSessions] = useState<APIOMOSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<APIOMOSession | null>(null);
  const [submittedBids, setSubmittedBids] = useState<Record<string, LocalBid>>({});
  const [timeLeft, setTimeLeft] = useState(4905);

  // Countdown timer (cosmetic)
  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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

  const activeSessions   = sessions.filter(s => s.status === 'Open');
  const completedSessions = sessions.filter(s => s.status === 'Completed');
  const myBids = Object.values(submittedBids);

  // Dealer tier — D002 is Tier1
  const dealerTier: 'Tier1' | 'Tier2' = 'Tier1';

  const handleBidSubmit = (bid: LocalBid) => {
    setSubmittedBids(p => ({ ...p, [bid.sessionId]: bid }));
    setSelectedSession(null);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OMO Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Open Market Operation sessions available to you</p>
        </div>
        <button onClick={fetchSessions} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['Active', 'My Bids', 'Completed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
            {t === 'Active' && activeSessions.length > 0 && (
              <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5">{activeSessions.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Active Sessions */}
      {tab === 'Active' && (
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
              <RefreshCw size={14} className="animate-spin" /> Loading sessions...
            </div>
          )}
          {!loading && activeSessions.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <AlertCircle size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No active OMO sessions at this time.</p>
              <p className="text-gray-400 text-sm mt-1">You will be notified when a new session opens.</p>
            </div>
          )}
          {activeSessions.map(s => {
            const bidCount  = s._count?.bids ?? 0;
            const hasBid    = !!submittedBids[s.id];
            const myBidAmt  = submittedBids[s.id]?.amount;

            return (
              <div key={s.id} className="bg-white rounded-xl border border-blue-200 shadow-sm p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{s.id}</h3>
                      <StatusBadge status={s.type} size="md" />
                      <StatusBadge status={s.status} size="md" />
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">You are Eligible</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-orange-700">
                    <Clock size={14} className="animate-pulse" />
                    {formatTime(timeLeft)}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {[
                    { label: 'Fixed Rate', value: fmtSL(Number(s.fixedRate)) },
                    { label: 'Total Pool', value: fmtUSD(Number(s.totalAmount)) },
                    { label: 'Your Tier', value: `${dealerTier} — Eligible` },
                    { label: 'Your Max Bid', value: fmtUSD(dealerTier === 'Tier1' ? Number(s.maxBidTier1) : Number(s.maxBidTier2)) },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="font-semibold text-gray-800 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Bid count progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{bidCount} bid{bidCount !== 1 ? 's' : ''} submitted</span>
                    <span>Duration: {s.durationMinutes} min</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-bos-blue rounded-full" style={{ width: `${Math.min(bidCount * 20, 100)}%` }} />
                  </div>
                </div>

                <div className="mt-4 flex gap-3 items-center">
                  {hasBid ? (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm font-medium">
                      <CheckCircle size={15} />
                      Bid submitted: {fmtUSD(myBidAmt!)}
                    </div>
                  ) : (
                    <button onClick={() => setSelectedSession(s)}
                      className="bg-bos-blue text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-bos-blue/90">
                      Submit Bid
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* My Bids */}
      {tab === 'My Bids' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Session', 'Bid Amount', 'Wallet', 'Submitted At', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myBids.map(b => (
                  <tr key={b.sessionId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-600 font-medium text-xs">{b.sessionId}</td>
                    <td className="px-4 py-3 font-semibold">{fmtUSD(b.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{b.wallet}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{b.submittedAt.replace('T', ' ').slice(0, 16)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {myBids.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No bids submitted this session.</p>
              <p className="text-gray-300 text-xs mt-1">Submit bids on active sessions to see them here.</p>
            </div>
          )}
        </div>
      )}

      {/* Completed */}
      {tab === 'Completed' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Session ID', 'Type', 'Fixed Rate', 'Total Amount', 'Start Time', 'Duration', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {completedSessions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-600 font-medium text-xs">{s.id}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.type} /></td>
                    <td className="px-4 py-3">SL {Number(s.fixedRate).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold">{fmtUSD(Number(s.totalAmount))}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{s.startTime.replace('T', ' ').slice(0, 16)}</td>
                    <td className="px-4 py-3 text-gray-500">{s.durationMinutes} min</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {completedSessions.length === 0 && !loading && (
            <p className="text-center text-gray-400 py-12">No completed sessions yet.</p>
          )}
        </div>
      )}

      {selectedSession && (
        <BidModal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          session={selectedSession}
          onSubmit={handleBidSubmit}
          dealerTier={dealerTier}
        />
      )}
    </div>
  );
};

export default DealerOMOSessions;
