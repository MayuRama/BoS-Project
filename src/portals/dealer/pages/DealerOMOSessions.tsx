import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { omoSessions } from '../../../data/mockData';

const fmtUSD = (n: number) => `$${n.toLocaleString()}`;
const fmtSL = (n: number) => `SL ${n.toLocaleString()}`;

const BidModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  session: typeof omoSessions[0];
  onSubmit: (amount: number) => void;
}> = ({ isOpen, onClose, session, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState('Zaad');
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form');
  const maxBid = session.maxBidTier1;
  const slEquiv = amount ? Number(amount) * session.fixedRate : 0;

  const handleSubmit = () => {
    if (step === 'form') { setStep('confirm'); return; }
    if (step === 'confirm') { onSubmit(Number(amount)); setStep('done'); return; }
    onClose(); setStep('form'); setAmount('');
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setStep('form'); setAmount(''); }} title={step === 'done' ? 'Bid Submitted' : 'Submit OMO Bid'} size="md">
      {step === 'done' ? (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center bg-green-100 text-green-600 rounded-full w-16 h-16 mb-4">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Bid Submitted Successfully!</h3>
          <p className="text-gray-500 text-sm mt-2">Your bid of <span className="font-semibold">{fmtUSD(Number(amount))}</span> for session {session.id} has been received.</p>
          <p className="text-gray-400 text-xs mt-1">You will be notified once allocation results are available.</p>
          <button onClick={() => { onClose(); setStep('form'); setAmount(''); }} className="mt-6 bg-bos-blue text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-bos-blue/90">Close</button>
        </div>
      ) : step === 'confirm' ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-blue-900">Please confirm your bid details</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Session', value: session.id },
                { label: 'Type', value: session.type },
                { label: 'Fixed Rate', value: fmtSL(session.fixedRate) },
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
          <div className="flex gap-3">
            <button onClick={() => setStep('form')} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Back</button>
            <button onClick={handleSubmit} className="flex-1 bg-bos-blue text-white py-2 rounded-lg text-sm font-semibold hover:bg-bos-blue/90">Confirm & Submit</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Session details recap */}
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Session ID', value: session.id },
              { label: 'Type', value: session.type },
              { label: 'Fixed Rate', value: fmtSL(session.fixedRate) },
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
              <p className="text-blue-600 text-xs mt-0.5">at fixed rate of SL {session.fixedRate.toLocaleString()} / USD</p>
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

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
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

const DealerOMOSessions: React.FC = () => {
  const [tab, setTab] = useState<'Active' | 'My Bids' | 'Completed'>('Active');
  const [selectedSession, setSelectedSession] = useState<typeof omoSessions[0] | null>(null);
  const [submittedBids, setSubmittedBids] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(4905);

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

  const activeSessions = omoSessions.filter(s => s.status === 'Open' || s.status === 'Pending Allocation');
  const myBids = omoSessions.flatMap(s => s.bids.filter(b => b.dealerId === 'D002').map(b => ({ ...b, session: s })));
  const completedSessions = omoSessions.filter(s => s.status === 'Completed');

  const handleBidSubmit = (sessionId: string, amount: number) => {
    setSubmittedBids(p => ({ ...p, [sessionId]: amount }));
    setSelectedSession(null);
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">OMO Sessions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Open Market Operation sessions available to you</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['Active', 'My Bids', 'Completed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Active Sessions — Cards */}
      {tab === 'Active' && (
        <div className="space-y-4">
          {activeSessions.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <AlertCircle size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No active OMO sessions at this time.</p>
              <p className="text-gray-400 text-sm mt-1">You will be notified when a new session opens.</p>
            </div>
          )}
          {activeSessions.map(s => {
            const totalBids = s.bids.reduce((a, b) => a + b.bidAmount, 0);
            const pct = Math.min((totalBids / s.totalAmount) * 100, 100);
            const hasBid = !!submittedBids[s.id];
            const isEligible = s.eligibleTiers.includes(1);

            return (
              <div key={s.id} className={`bg-white rounded-xl border shadow-sm p-5 ${s.status === 'Open' ? 'border-blue-200' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{s.id}</h3>
                      <StatusBadge status={s.type} size="md" />
                      <StatusBadge status={s.status} size="md" />
                      {isEligible && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">You are Eligible</span>}
                    </div>
                  </div>
                  {s.status === 'Open' && (
                    <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-orange-700">
                      <Clock size={14} className="animate-pulse" />
                      {formatTime(timeLeft)}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {[
                    { label: 'Fixed Rate', value: `SL ${s.fixedRate.toLocaleString()}` },
                    { label: 'Total Pool', value: fmtUSD(s.totalAmount) },
                    { label: 'Your Tier', value: `Tier 1 — ${isEligible ? 'Eligible' : 'Not Eligible'}` },
                    { label: 'Your Max Bid', value: fmtUSD(s.maxBidTier1) },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="font-semibold text-gray-800 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Pool Subscribed: {fmtUSD(totalBids)} / {fmtUSD(s.totalAmount)}</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-bos-blue rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="mt-4 flex gap-3 items-center">
                  {hasBid ? (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm font-medium">
                      <CheckCircle size={15} />
                      Bid submitted: {fmtUSD(submittedBids[s.id])}
                    </div>
                  ) : s.status === 'Open' && isEligible ? (
                    <button onClick={() => setSelectedSession(s)}
                      className="bg-bos-blue text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-bos-blue/90">
                      Submit Bid
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400">Bidding not available</span>
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
                  {['Session', 'Type', 'Bid Amount', 'Submitted At', 'Status', 'Allocated Amount'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myBids.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-600 font-medium text-xs">{b.sessionId}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.session.type} /></td>
                    <td className="px-4 py-3 font-semibold">{fmtUSD(b.bidAmount)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{b.submittedAt.replace('T', ' ').slice(0, 16)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 font-medium text-green-700">{b.allocatedAmount ? fmtUSD(b.allocatedAmount) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {myBids.length === 0 && <p className="text-center text-gray-400 py-12">No bids submitted yet.</p>}
        </div>
      )}

      {/* Completed */}
      {tab === 'Completed' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Session ID', 'Type', 'Fixed Rate', 'Total Amount', 'Start Time', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {completedSessions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-600 font-medium text-xs">{s.id}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.type} /></td>
                    <td className="px-4 py-3">SL {s.fixedRate.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold">{fmtUSD(s.totalAmount)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{s.startTime.replace('T', ' ').slice(0, 16)}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedSession && (
        <BidModal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          session={selectedSession}
          onSubmit={(amt) => handleBidSubmit(selectedSession.id, amt)}
        />
      )}
    </div>
  );
};

export default DealerOMOSessions;
