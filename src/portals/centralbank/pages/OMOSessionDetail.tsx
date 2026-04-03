import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, Zap } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import { omoSessions } from '../../../data/mockData';

const fmtUSD = (n: number) => `$${n.toLocaleString()}`;

const newBidNames = [
  { dealerName: 'Somtel FX Bureau', tier: 2 as const, amount: 80000 },
  { dealerName: 'Mustaqbal Exchange', tier: 2 as const, amount: 60000 },
  { dealerName: 'Caafi Currency', tier: 2 as const, amount: 40000 },
];

const OMOSessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = omoSessions.find(s => s.id === id);
  const [bids, setBids] = useState(session?.bids ?? []);
  const [timeLeft, setTimeLeft] = useState(4905); // ~1h23m45s
  const [allocated, setAllocated] = useState(false);
  const [bidIdx, setBidIdx] = useState(0);

  useEffect(() => {
    if (!session || session.status !== 'Open') return;
    const interval = setInterval(() => {
      setTimeLeft(t => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session || session.status !== 'Open') return;
    const interval = setInterval(() => {
      if (bidIdx < newBidNames.length) {
        const nb = newBidNames[bidIdx];
        setBids(prev => [...prev, {
          id: `BID-NEW-${bidIdx}`,
          sessionId: id!,
          dealerId: `D-NEW-${bidIdx}`,
          dealerName: nb.dealerName,
          tier: nb.tier,
          bidAmount: nb.amount,
          submittedAt: new Date().toISOString(),
          status: 'Submitted' as const,
          wallet: 'Zaad' as const,
        }]);
        setBidIdx(i => i + 1);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [session, bidIdx, id]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleAllocate = () => setAllocated(true);

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Session not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline flex items-center gap-1">
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    );
  }

  const totalBids = bids.reduce((a, b) => a + b.bidAmount, 0);
  const pct = Math.min((totalBids / session.totalAmount) * 100, 100);

  const allocationResults = allocated ? bids.map(b => ({
    ...b,
    allocatedAmount: Math.min(b.bidAmount, Math.floor(session.totalAmount / bids.length)),
    settlementStatus: 'Pending',
  })) : [];

  return (
    <div className="p-6 space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">Session #{session.id}</h1>
            <StatusBadge status={session.status} size="md" />
            {session.status === 'Open' && (
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-3 py-1 text-sm font-mono font-semibold">
                <Clock size={14} className="animate-pulse" />
                {formatTime(timeLeft)} remaining
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Fixed Rate', value: `SL ${session.fixedRate.toLocaleString()}` },
          { label: 'Total Liquidity', value: fmtUSD(session.totalAmount) },
          { label: 'Eligible Tiers', value: `Tier ${session.eligibleTiers.join(' & ')}` },
          { label: 'Allocation Method', value: session.allocationMethod },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium">{item.label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Liquidity bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-gray-800">Bids Received vs Total Pool</h2>
          <span className="text-sm font-bold text-gray-700">{fmtUSD(totalBids)} / {fmtUSD(session.totalAmount)}</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-bos-green to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{pct.toFixed(1)}% subscribed — {bids.length} bids received</p>
      </div>

      {/* Bids table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Live Bids</h2>
          {session.status === 'Open' && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                {['Dealer Name', 'Tier', 'Bid Amount (USD)', 'Submitted At', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bids.map(bid => (
                <tr key={bid.id} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-4 font-medium text-gray-800">{bid.dealerName}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bid.tier === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      Tier {bid.tier}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-semibold">{fmtUSD(bid.bidAmount)}</td>
                  <td className="py-2.5 pr-4 text-gray-400 text-xs">{bid.submittedAt.replace('T', ' ').slice(0, 16)}</td>
                  <td className="py-2.5 pr-4"><StatusBadge status={bid.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action buttons */}
      {!allocated && (session.status === 'Open' || session.status === 'Pending Allocation') && (
        <div className="flex gap-3">
          <button onClick={handleAllocate}
            className="flex items-center gap-2 bg-bos-green text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-bos-green/90">
            <Zap size={16} /> Execute Allocation
          </button>
          <button className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
            <XCircle size={16} /> Close Session
          </button>
          <button className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50">
            Cancel Session
          </button>
        </div>
      )}

      {/* Allocation Results */}
      {allocated && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={20} className="text-green-600" />
            <h2 className="text-sm font-semibold text-green-800">Allocation Executed Successfully</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Dealer', 'Bid Amount', 'Allocated Amount', 'Exchange Rate', 'Settlement Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allocationResults.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium">{r.dealerName}</td>
                    <td className="px-4 py-2.5">{fmtUSD(r.bidAmount)}</td>
                    <td className="px-4 py-2.5 font-semibold text-green-700">{fmtUSD(r.allocatedAmount || 0)}</td>
                    <td className="px-4 py-2.5">SL {session.fixedRate.toLocaleString()}</td>
                    <td className="px-4 py-2.5"><StatusBadge status="Pending" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OMOSessionDetail;
